sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"org/js/mobx/3.5.1/mobx.umd.min",
	"sap/ui/mobx/MobxModel"
], function(JSONModel, Device, __mobx, MobxModel) {
	"use strict";

	return {
		createDeviceModel: function() {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		
		createDomainModel: function() {
			var state = __mobx.observable({
				SnowWhite: {
					FirstName: undefined,
					LastName: undefined,
					Age: undefined
				},
				Dwarfs: []
			});
			
			var oModel = new MobxModel(state);
			
			return oModel;
		}
	};
});