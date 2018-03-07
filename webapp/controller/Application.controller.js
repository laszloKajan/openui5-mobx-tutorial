sap.ui.define([
	"sap/m/MessagePopover",
	"sap/m/MessagePopoverItem",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/message/ControlMessageProcessor",
	"sap/ui/model/type/String",
	"sap/ui/model/ParseException",
	"sap/ui/model/ValidateException",
	"sap/ui/model/ListBinding",
	"org/debian/lkajan/mobxTutorial/model/models"
], function(MessagePopover, MessagePopoverItem, Controller, JSONModel, ControlMessageProcessor, TypeString, ParseException,
	ValidateException, ListBinding, models) {
	"use strict";

	var oMessageTemplate = new MessagePopoverItem({
		type: "{type}",
		title: "{message}",
		description: "{description}",
		subtitle: "{subtitle}",
		counter: "{counter}"
	});

	var oMessagePopover = new MessagePopover({
		items: {
			path: "/",
			template: oMessageTemplate
		}
	});

	return Controller.extend("org.debian.lkajan.mobxTutorial.controller.Application", {

		onInit: function() {

			// Domain model
			var oDomainModel = models.createDomainModel();
			this.getView().setModel(oDomainModel, "domain");

			// Application model
			var oAppModel = new JSONModel({
				messageCount: 0,
				canSubmit: false
			});
			this.getView().setModel(oAppModel);

			// Message management
			var oMessageManager = sap.ui.getCore().getMessageManager(),
				oMessageProcessor = new ControlMessageProcessor();
			oMessageManager.registerMessageProcessor(oMessageProcessor);
			oMessageManager.registerObject(this.getView(), true); // Handle validation for this view

			this._oMessageModelBinding = new ListBinding(oMessageManager.getMessageModel(), "/");
			this._oMessageModelBinding.attachChange(this._updateMessageCount, this);

			oMessagePopover.setModel(oMessageManager.getMessageModel());
		},

		onExit: function() {

			this._oMessageModelBinding.detachChange(this._updateMessageCount, this);
			this._oMessageModelBinding.destroy();
		},

		onChangeRevalidate: function(oEvent) {

			this.validateDomain();
		},

		onFixSWFirstName: function() {

			this.getView().getModel("domain").setProperty("/ShowWhite/FirstName", "Snow");
			this.validateDomain();
		},

		onValidationMessagesPress: function(oEvent) {

			oMessagePopover.toggle(oEvent.getSource());
		},

		validateDomain: function() {

			try {
				var bValid = true;

				bValid = bValid && this._validateInput("inputSWFirstName");
				bValid = bValid && this._validateInput("inputSWLastName");
				bValid = bValid && this._validateInput("inputSWAge");

				this.getView().getModel().setProperty("/canSubmit", bValid);
			} catch (oEx) {
				this.getView().getModel().setProperty("/canSubmit", false);
				throw oEx;
			}
		},

		_updateMessageCount: function() {

			this.getView().getModel().setProperty("/messageCount", oMessagePopover.getModel().getData().length);
		},

		_validateInput: function(sId) {

			var bValid = true;
			var oControl = this.byId(sId);

			try {
				var oControlBinding = oControl.getBinding("value");
				var oType = oControlBinding.getType();
				var oExternalValue = oControl.getProperty("value");
				var oInternalValue = oType.parseValue(oExternalValue, oControlBinding.sInternalType);
				oType.validateValue(oInternalValue);
			} catch (oException) {
				if (oException instanceof ParseException || oException instanceof ValidateException) {
					bValid = false;
				} else {
					throw oException;
				}
			}
			return bValid;
		}
	});
});