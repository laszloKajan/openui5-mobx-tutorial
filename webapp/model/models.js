sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"org/js/mobx/3.5.1/mobx.umd.min",
	"sap/ui/mobx/MobxModel",
	"sap/ui/model/type/String",
	"org/debian/lkajan/mobxTutorial/model/type/Generator",
	"sap/ui/model/ParseException",
	"sap/ui/model/ValidateException"
], function(JSONModel, Device, __mobx, MobxModel, String, MobxModelTypeGenerator, ParseException, ValidateException) {
	"use strict";

	var MobxModelTypeString = MobxModelTypeGenerator.getExtendedType(String, "String");
	var oMobxModelTypeStringName = new MobxModelTypeString({}, {
		search: /^(|[^0-9\s]{3,})$/
	});
	
	var oValidationMemory = {};
	var _memoize = function(fFunc) { // Consider something cleverer
		var fMemFunc = function() {
			var sKey = JSON.stringify(arguments);

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

	var models = {
		createDeviceModel: function() {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		createDomainModel: function() {
			var state = __mobx.observable({
				SnowWhite: {
					FirstName: undefined,
					FirstName$Changed: false,
					get FirstName$Validation() {
						return models.getModelPropertyValidationByType(this, "FirstName", oMobxModelTypeStringName, "string", state.$ignoreChanged);
					},
					LastName: undefined,
					Age: undefined
				},
				Dwarfs: [],
				//
				$ignoreChanged: false // If true, set $Validation.valueState regardless of $Changed state
			});

			var oModel = new MobxModel(state);

			return oModel;
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