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
	"org/debian/lkajan/mobxTutorial/model/models",
	"org/js/mobx/3.5.1/mobx.umd.min",
	"sap/ui/mobx/MobxModel"
], function(MessagePopover, MessagePopoverItem, Controller, JSONModel, ControlMessageProcessor, TypeString, ParseException,
	ValidateException, ListBinding, models, __mobx, MobxModel) {
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
			path: "/validationMessages",
			template: oMessageTemplate
		}
	});

	return Controller.extend("org.debian.lkajan.mobxTutorial.controller.Application", {

		onInit: function() {

			// Domain model
			var oDomainModel = models.createDomainModel();
			this.getView().setModel(oDomainModel, "domain");

			// Application model
			var oAppModel = new MobxModel(__mobx.observable({
				canSubmit: false,
				validationMessages: [],
				get validationMessagesLength() {
					return this.validationMessages.length;
				}
			}));
			this.getView().setModel(oAppModel);

			// Message management
			var oMessageManager = sap.ui.getCore().getMessageManager(),
				oMessageProcessor = new ControlMessageProcessor();
			oMessageManager.registerMessageProcessor(oMessageProcessor);
			oMessageManager.registerObject(this.getView(), true); // Handle validation for this view

			//	Merge messages from oMessageManager and oDomainModel
			this.oObservableValidation = __mobx.observable({
				Messages: [] // will be replaced by transformation to observable array
			});

			//	Transform domain model to validation message array
			this._fValidationAutorunDisposer = __mobx.reaction(
				models.transformModelToValidationMessageArray.bind(this, oDomainModel.getObservable()),
				function(aMessages) {
					// Consider debouncing
					this.oObservableValidation.Messages = aMessages;
				}.bind(this)
			);

			//	Merge messages when oDomainModel validation changes
			__mobx.reaction(
				function() {
					return this.oObservableValidation.Messages.peek();
				}.bind(this),
				this._mergeMessageModelMessages.bind(this)
			);

			//	Merge messages when oMessageManager validation changes
			this._oMessageModelBinding = new ListBinding(oMessageManager.getMessageModel(), "/");
			this._oMessageModelBinding.attachChange(this._mergeMessageModelMessages, this);

			oMessagePopover.setModel(oAppModel);
		},

		onExit: function() {

			this._fValidationAutorunDisposer();
			this._oMessageModelBinding.detachChange(this._mergeMessageModelMessages, this);
			this._oMessageModelBinding.destroy();
		},

		onChangeSetChanged: function(oEvent) {

			var oModel = oEvent.getSource().getBinding("value").getModel();
			var sPath = oEvent.getSource().getBinding("value").getPath();

			oModel.setProperty(sPath + "$Changed", true);
		},

		onChangeRevalidate: function(oEvent) {

			this.validateDomain();
		},

		onFixSWFirstName: function() {

			this.getView().getModel("domain").setProperty("/SnowWhite/FirstName", "Snow");
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

		_mergeMessageModelMessages: function() {

			var oMessageManager = sap.ui.getCore().getMessageManager();

			this.getView().getModel().getObservable().validationMessages =
				oMessageManager.getMessageModel().getData().concat(this.oObservableValidation.Messages.peek());
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