sap.ui.define([
	"sap/ui/model/type/String",
	"sap/ui/model/ParseException",
	"sap/ui/model/ValidateException"
], function(BaseType, ParseException, ValidateException) {
	"use strict";

	return BaseType.extend("org.debian.lkajan.mobxTutorial.model.type.raw.StringWithApple", {
		formatValue: function(value, sInternalType) {
			var sFormatted = BaseType.prototype.formatValue.apply(this, arguments);
			return sFormatted ? "🍎" + sFormatted : ""; // U+1F34E
		},

		parseValue: function(value, sInternalType) { // Parse a value of an internal type to the expected value of the model type

			var sApple = "🍎";
			var sParsed = value;
			if(value && value.indexOf(sApple) === 0) {
				// throw new ParseException("Enter a name that begins with 🍎.");
				sParsed = value.slice(sApple.length); // It's two indices long
			}
			return BaseType.prototype.parseValue.call(this, sParsed, sInternalType);
		},

		validateValue: function(value) { // Validate whether a given value in model representation is valid and meets the defined constraints

			try {
				BaseType.prototype.validateValue.apply(this, arguments);
			} catch (oException) {
				if(oException instanceof ValidateException) {
					if(oException.message.startsWith("Enter a value matching ")) {
						oException.message = "Enter at least 3 letters, prefix with '🍎'.";
					}
				}
				throw oException;
			}
		}
	});
});