sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function(JSONModel, Device) {
	"use strict";

	return {
		createDeviceModel: function() {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		
		createDomainModel: function() {
			var oModel = new JSONModel({
				ShowWhite: {},
				Dwarfs: []
			});
			
			return oModel;
		}
	};
});