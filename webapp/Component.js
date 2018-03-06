jQuery.sap.registerModuleShims({
	"org/js/mobx/3.5.1/mobx.umd.min": {
		exports: "mobx"
	}
});

/* eslint-disable sap-no-hardcoded-url */
jQuery.sap.registerModulePath("org.js.mobx", "https://cdnjs.cloudflare.com/ajax/libs/mobx/3.5.1/mobx.min.js");
jQuery.sap.registerModulePath("sap.ui.mobx", "https://raw.githubusercontent.com/laszloKajan/openui5-mobx-model/master/src");
/* eslint-enable sap-no-hardcoded-url */

sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"org/debian/lkajan/mobxTutorial/model/models"
], function(UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("org.debian.lkajan.mobxTutorial.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
		}
	});
});