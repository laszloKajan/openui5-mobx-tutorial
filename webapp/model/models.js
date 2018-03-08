sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"org/js/mobx/3.5.1/mobx.umd.min",
	"sap/ui/mobx/MobxModel",
	"sap/ui/model/type/String",
	"org/debian/lkajan/mobxTutorial/model/type/Generator",
	"sap/ui/model/ParseException",
	"sap/ui/model/ValidateException",
	"sap/ui/core/message/Message"
], function(JSONModel, Device, __mobx, MobxModel, String, MobxModelTypeGenerator, ParseException, ValidateException, Message) {
	"use strict";

	var MobxModelTypeString = MobxModelTypeGenerator.getExtendedType(String, "String");
	var oMobxModelTypeStringName = new MobxModelTypeString({}, {
		search: /^(|[^0-9\s]{3,})$/
	});

	var oValidationMemory = {};
	var _memoize = function(fFunc) { // Consider something cleverer
		var fMemFunc = function() {
			var sKey = JSON.stringify(arguments); // Well, we should hash this really

			if (oValidationMemory.hasOwnProperty(sKey)) {
				jQuery.sap.clearDelayedCall(oValidationMemory[sKey].sDelayedCallId);
				oValidationMemory[sKey].sDelayedCallId = jQuery.sap.delayedCall(333,
					this, // Object from which the method should be called, will be 'this' in callback (without binding)
					function() {
						delete oValidationMemory[sKey];
					});

				return JSON.parse(JSON.stringify(oValidationMemory[sKey].value));
			} else {
				var oRet = fFunc.apply(this, arguments);
				oValidationMemory[sKey] = {
					value: oRet,
					sDelayedCallId: jQuery.sap.delayedCall(333,
						this, // Object from which the method should be called, will be 'this' in callback (without binding)
						function() {
							delete oValidationMemory[sKey];
						})
				};

				return JSON.parse(JSON.stringify(oRet));
			}
		};
		return fMemFunc;
	};

	var fFilterValidationToMessage = function(oValidation) {
		return oValidation.valueState !== "None";
	};
	var fTransformValidation = __mobx.createTransformer(function(oValidation) {
		return {
			valid: oValidation.valid,
			valueState: oValidation.valueState,
			valueStateText: oValidation.valueStateText
				// May add path and other properties
		};
	});
	var fTransformModelToValidationArray = function(__p) { // ({node: stateNode, path: "", acc: aAccumulator})

		var oNode = __p.node;
		var oAcc = __p.acc;
		var bIsObservableObject = __mobx.isObservableObject(oNode);
		var aKeys = __mobx.isObservableArray(oNode) ? Object.keys(oNode.peek()) : Object.getOwnPropertyNames(oNode); // We need get() properties too, but ...

		aKeys.filter(function(sKey) {
			return sKey.indexOf("$") === -1;
		}).reduce(function(poAcc, sKey) {

			var sValLeafKey = sKey + "$Validation";

			if (oNode.hasOwnProperty(sValLeafKey)) {

				var oValidation = oNode[sValLeafKey];

				// console.log(__p.path + "/" + sKey + ": " + oValidation.valueState);

				if (!oValidation.valid) {
					var oValidationTransformed = fTransformValidation(oValidation);
					poAcc.push(oValidationTransformed);
				}
			} else {
				// Descend?
				switch (typeof(oNode[sKey])) {
					case "boolean":
					case "number":
					case "string":
					case "undefined":
						break;
					default:
						if (!bIsObservableObject || Object.getOwnPropertyDescriptor(oNode, sKey).enumerable) { // Model calculated (get) properties become 'enumberable = false' while being made observable

							var childNode = oNode[sKey];
							fTransformModelToValidationArray({
								node: childNode,
								path: __p.path + "/" + sKey,
								acc: poAcc
							});
						}
				}
			}
			return oAcc;
		}, oAcc);

		return oAcc;
	};

	var fTransformValidationToMessage = __mobx.createTransformer(function(oValidation) { // Current value, index, array
		return new Message({
			message: oValidation.valueStateText.replace(/([{}])/g, "\\$1"),
			type: oValidation.valueState,
			validation: true
		});
	});

	var models = {
		createDeviceModel: function() {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		createDomainModel: function() {
			var state = __mobx.observable({
				SnowWhite: {
					FirstName: "",
					FirstName$Changed: false,
					get FirstName$Validation() {
						return models.getModelPropertyValidationByType(this, "FirstName", oMobxModelTypeStringName, "string", state.$ignoreChanged);
					},
					LastName: "",
					LastName$Changed: false,
					get LastName$Validation() {
						return models.getModelPropertyValidationByType(this, "LastName", oMobxModelTypeStringName, "string", state.$ignoreChanged);
					},
					get FullName() {
						return (this.FirstName ? (this.FirstName + (this.LastName ? " " : "")) : "") + (this.LastName || "");
					},
					get FullName$Changed() { // Indicates "changed by user"
						return this.FirstName$Changed || this.LastName$Changed;
					},
					get FullName$Validation() {

						var bValid = this.FirstName$Validation.valid && this.LastName$Validation.valid && Boolean(this.FullName);
						return {
							valid: bValid,
							valueState: bValid ? "None" : (this.FullName$Changed || state.$ignoreChanged ? "Error" : "None"),
							valueStateText: bValid ? "" : "Enter at least either a correct first name or last name."
						};
					},
					Age: undefined
				},
				Dwarfs: [],
				get DwarfCount() {
					return this.Dwarfs.length;
				},
				//
				$ignoreChanged: false // If true, set $Validation.valueState regardless of $Changed state
			});

			var oModel = new MobxModel(state);

			return oModel;
		},

		createDwarf: function() {
			return {
				FirstName: "",
				LastName: ""
			};
		},

		/**
		 * Get model object property validation results by type validation. Non-changed state appears to be valid regardless of validity.
		 *
		 * @param {object} oObject - 		Model object
		 * @param {string} sProperty -		Model object property name
		 * @param {object} oType -			Property type instance
		 * @param {string} sInternalType -	Type used to display and input property, c.f. model type
		 * @param {boolean} bIgnoreChanged - Ignore (non-)changed state of property when setting valueState. true: valueState is set even if value hasn't been
		 *										changed by user
		 * @return {object} 		{valid: boolean, valueState: sap.ui.core.ValueState, valueStateText: string}
		 */
		getModelPropertyValidationByType: function(oObject, sProperty, oType, sInternalType, bIgnoreChanged) {

			var oRet = models._transformModelPropertyToValidationByType({
				value: oObject[sProperty],
				oType: oType,
				sInternalType: sInternalType
			});

			if (!oRet.valid) {
				var bChanged = oObject[sProperty + "$Changed"];
				oRet.valueState = bChanged || bIgnoreChanged ? "Error" : "None";
			} else {
				oRet.valueState = "None";
			}
			return oRet;
		},

		transformModelToValidationArray: __mobx.createTransformer(function(oSource) {
			return fTransformModelToValidationArray({
				node: oSource,
				path: "",
				acc: []
			});
		}),

		transformValidationArrayToValidationMessages: __mobx.createTransformer(function(__p) { // {source, validationArrayKey}
			var oSource = __p.source,
				sKey = __p.validationArrayKey;
			return oSource[sKey].filter(fFilterValidationToMessage).map(fTransformValidationToMessage);
		}),

		_transformModelPropertyToValidationByType: _memoize(function(oSource) { // Memoize

			if (!oSource.oType || !oSource.sInternalType) {
				throw new Error("Invalid function call");
			}

			var value = oSource.value;
			var oRet = {
				valid: true,
				valueStateText: ""
			};

			try {
				var parsedValue = oSource.oType.parseValue(value, oSource.sInternalType, true);
				oSource.oType.validateValue(parsedValue, true);
			} catch (oException) {
				if (oException instanceof ParseException || oException instanceof ValidateException) {
					oRet.valid = false;
					oRet.valueStateText = oException.message;
				} else {
					throw oException;
				}
			}
			return oRet;
		})
	};
	return models;
});