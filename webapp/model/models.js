sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"org/js/mobx/3.5.1/mobx.umd.min",
	"sap/ui/mobx/MobxModel",
	"sap/ui/model/type/String",
	"org/debian/lkajan/mobxTutorial/model/type/raw/StringWithApple",
	"org/debian/lkajan/mobxTutorial/model/type/Factory",
	"sap/ui/model/ParseException",
	"sap/ui/model/ValidateException",
	"sap/ui/core/message/Message"
], function(JSONModel, Device, __mobx, MobxModel, String, RawStringWithApple, MobxModelTypeFactory, ParseException, ValidateException,
	Message) {
	"use strict";

	var MobxModelTypeString = MobxModelTypeFactory.getExtendedType(String, "org.debian.lkajan.mobxTutorial.model.type.String");
	var oMobxModelTypeStringName = new MobxModelTypeString({}, {
		search: /^(|[^0-9\s]{3,})$/
	});

	var MobxModelTypeStringWithApple = MobxModelTypeFactory.getExtendedType(RawStringWithApple,
		"org.debian.lkajan.mobxTutorial.model.type.StringWithApple");
	var oMobxModelTypeStringWithApple = new MobxModelTypeStringWithApple({}, {
		search: /^(|[^0-9\s]{3,})$/
	});

	var oCacheForNodePath = {};
	var _fGetNodePathObject = function(oNode, sPath) {
		var oNodePath = oCacheForNodePath[sPath];
		if (!oNodePath) {
			oCacheForNodePath[sPath] = oNodePath = {
				node: oNode,
				path: sPath
			};
		}
		return oNodePath;
	};

	var _fGetKeyForArguments = function() { // Well, we should use hashing really
		return JSON.stringify(arguments, function(key, value) {
			if (value instanceof RegExp) {
				return value.toString();
			} else {
				return value;
			}
		});
	};

	var oCacheForValueType = {};
	var _fGetValueTypeObject = function(value, oType, sInternalType) {
		var sKey = _fGetKeyForArguments.apply(this, arguments);
		var oValueType = oCacheForValueType[sKey];
		if (!oValueType) {
			oCacheForValueType[sKey] = oValueType = {
				value: value,
				oType: oType,
				sInternalType: sInternalType
			};
		}
		return oValueType;
	};
	var _fTransformModelPropertyToValidationByTypeMobX = __mobx.createTransformer(
		function(oSource) { // {value, oType, sInternalType}
			//					Is memoization really worth it here?
			if (!oSource.oType || !oSource.sInternalType) {
				throw new Error("Invalid function call");
			}
			// console.log("_fTransformModelPropertyToValidationByTypeMobX");
			var oRet = {
				valid: true,
				valueStateText: ""
			};

			try {
				var parsedValue = oSource.oType.parseValue(oSource.value, oSource.sInternalType, true);
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
		},
		function(result, oSource) {
			// Cleanup
			delete oCacheForValueType[_fGetKeyForArguments(oSource.value, oSource.oType, oSource.sInternalType)];
		});
	var _fTransformModelPropertyToValidationByType = function(value, oType, sInternalType) {
		var oSource = _fGetValueTypeObject(value, oType, sInternalType);
		return _fTransformModelPropertyToValidationByTypeMobX(oSource);
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
	var fTransformModelToValidationArray;
	var _fTransformModelToValidationArrayMobX = __mobx.createTransformer(
		function(__p) { // ({node: stateNode, path: ""})

			var oNode = __p.node;
			var bIsObservableObject = __mobx.isObservableObject(oNode);
			var aKeys = __mobx.isObservableArray(oNode) ? Object.keys(oNode.peek()) : Object.getOwnPropertyNames(oNode); // We need get() properties too, but ...

			var oAcc = aKeys.filter(function(sKey) {
				return sKey.indexOf("$") === -1;
			}).reduce(function(poAcc, sKey) {

				var sValLeafKey = sKey + "$Validation";

				if (oNode.hasOwnProperty(sValLeafKey)) {

					var oValidation = oNode[sValLeafKey];

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

								var sChildPath = __p.path + "/" + sKey;
								var oChildNode = oNode[sKey];
								var aChildRes = fTransformModelToValidationArray(oChildNode, sChildPath);
								Array.prototype.push.apply(poAcc, aChildRes);
							}
					}
				}
				return poAcc;
			}, []);

			// console.log("fTransformModelToValidationArray" + " " + __p.path);

			return oAcc;
		},
		function(result, value) {
			// Cleanup
			delete oCacheForNodePath[value.path];
		});
	fTransformModelToValidationArray = function(oNode, sPath) {
		var oNodePath = _fGetNodePathObject(oNode, sPath);
		return _fTransformModelToValidationArrayMobX(oNodePath);
	};

	var fTransformValidationToMessage = __mobx.createTransformer(function(oValidation) { // Current value, index, array
		return new Message({
			message: oValidation.valueStateText.replace(/([{}])/g, "\\$1"),
			type: oValidation.valueState,
			validation: true
		});
	});

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
	var fGetModelPropertyValidationByType = function(oObject, sProperty, oType, sInternalType, bIgnoreChanged) {

		var oRet = _fTransformModelPropertyToValidationByType(oObject[sProperty], oType, sInternalType);

		if (!oRet.valid) {
			var bChanged = oObject[sProperty + "$Changed"];
			oRet.valueState = bChanged || bIgnoreChanged ? "Error" : "None";
		} else {
			oRet.valueState = "None";
		}
		return oRet;
	};

	var models = {
		createDeviceModel: function() {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		createDomainModel: function(oI18nResourceBundle) {
			var state = __mobx.observable({
				SnowWhite: {
					FirstName: "",
					FirstName$Changed: false,
					get FirstName$Validation() {
						return fGetModelPropertyValidationByType(this, "FirstName", oMobxModelTypeStringName, "string", state.$ignoreChanged);
					},
					get FirstName$WithApple$Validation() {
						return fGetModelPropertyValidationByType(this, "FirstName", oMobxModelTypeStringWithApple, "string", state.$ignoreChanged);
					},

					LastName: "",
					LastName$Changed: false,
					get LastName$Validation() {
						return fGetModelPropertyValidationByType(this, "LastName", oMobxModelTypeStringName, "string", state.$ignoreChanged);
					},
					//
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
							valueStateText: bValid ? "" : oI18nResourceBundle.getText("atLeastCorrectFirstOrLast")
						};
					},
					//
					Age: undefined
				},
				Dwarfs: [],
				get DwarfCount() {
					return this.Dwarfs.length;
				},
				//
				$ignoreChanged: false // If true, set $Validation.valueState regardless of $Changed state
			});

			// Dwarf handling
			__mobx.observe(state, "Dwarfs", function(change0) { // Returns a disposer
				if (change0.type === "update") {
					__mobx.intercept(state.Dwarfs, function(change) {
						// New dwarf(s) added
						if (change.type === "splice" && change.added.length) {
							var oDwarfExtension = {
								FirstName$Changed: false,
								get FirstName$Validation() {
									return fGetModelPropertyValidationByType(this, "FirstName", oMobxModelTypeStringName, "string", state.$ignoreChanged);
								},
								//
								LastName$Changed: false,
								get LastName$Validation() {
									return fGetModelPropertyValidationByType(this, "LastName", oMobxModelTypeStringName, "string", state.$ignoreChanged);
								},
								//
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
										valueStateText: bValid ? "" : oI18nResourceBundle.getText("atLeastCorrectFirstOrLast")
									};
								}
							};

							for (var i = 0; i < change.added.length; ++i) {
								if (!__mobx.isObservableObject(change.added[i])) {
									change.added[i] = __mobx.observable(change.added[i]);
								}
								var oDwarf = change.added[i];
								__mobx.extendObservable(oDwarf, oDwarfExtension);
							}
						}
						return change;
					});
				}
			}, true); // invokeImmediately

			var oModel = new MobxModel(state);
			return oModel;
		},

		createDwarf: function() {
			return {
				FirstName: "",
				LastName: ""
			};
		},

		transformModelToValidationArray: __mobx.createTransformer(function(oSource) {
			return fTransformModelToValidationArray(oSource, "");
		}),

		transformValidationArrayToValidationMessages: __mobx.createTransformer(function(aSource) {
			return aSource.filter(fFilterValidationToMessage).map(fTransformValidationToMessage);
		})
	};
	return models;
});