jQuery.sap.registerModuleShims({
	"org/js/mobx/mobx.umd.min": {
		exports: "mobx"
	},
	"org/js/mobxUtils/mobx-utils.umd": {
		exports: "mobxUtils"
	}
});

/* eslint-disable sap-no-hardcoded-url */
jQuery.sap.registerModulePath("org.js.mobx", "https://cdnjs.cloudflare.com/ajax/libs/mobx/4.1.1");
jQuery.sap.registerModulePath("org.js.mobxUtils", "https://unpkg.com/mobx-utils@4.0.0");
// jQuery.sap.registerModulePath("sap.ui.mobx", "https://raw.githubusercontent.com/laszloKajan/openui5-mobx-model/master/src");
// jQuery.sap.registerModulePath("sap.ui.mobxValidation", "https://raw.githubusercontent.com/laszloKajan/openui5-mobx-model-validation/master/src");
// jQuery.sap.registerModulePath("org.js.mobx", "/sap/bc/bsp/sap/zx6g_libmobx/4.1.1");
// jQuery.sap.registerModulePath("org.js.mobxUtils", "/sap/bc/bsp/sap/zx6g_libmobx_utils/4.0.0");
jQuery.sap.registerModulePath("sap.ui.mobx", "/sap/bc/ui5_ui5/sap/zx6g_libmobxui5");
jQuery.sap.registerModulePath("sap.ui.mobxValidation", "/sap/bc/ui5_ui5/sap/zx6g_libmobxval");
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