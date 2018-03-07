sap.ui.define([
	"sap/ui/model/ParseException",
	"sap/ui/model/ValidateException"
], function(ParseException, ValidateException) {
	"use strict";

	return {
		getExtendedType: function(BaseType, sNewTypeName) {
			return BaseType.extend("org.debian.lkajan.mobxTutorial.model.type." + sNewTypeName, {
				formatValue: function(value, sInternalType) {
					try {
						// Don't format it if it can't be parsed
						this.parseValue(value, sInternalType, true);
						return BaseType.prototype.formatValue.apply(this, arguments);
					} catch (oException) {
						if (oException instanceof ParseException) {
							return value;
						} else {
							throw oException;
						}
					}
				},

				parseValue: function(value, sInternalType, bModelValidation) { // Parse a value of an internal type to the expected value of the model type

					try {
						var retVal = value; // Do not simplify, keep it with retVal
						retVal = BaseType.prototype.parseValue.apply(this, arguments);
						return retVal;
					} catch (oException) {
						if (bModelValidation) {
							throw oException;
						} else {
							return retVal;
						}
					}
				},

				validateValue: function(value, bModelValidation) { // Validate whether a given value in model representation is valid and meets the defined constraints

					// Only perform if bModelValidation
					if (bModelValidation) {
						try {
							BaseType.prototype.validateValue.apply(this, arguments);
						} catch (oException) {
							if (!(oException instanceof ParseException) && !(oException instanceof ValidateException)) {
								
								var sMsg = oException.message;
								throw new ValidateException(sMsg);
							} else {
								throw oException;
							}
						}
					}
				}
			});
		}
	};
});