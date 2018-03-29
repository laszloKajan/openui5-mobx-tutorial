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
	"org/js/mobx/mobx.umd",
	"sap/ui/mobx/MobxModel",
	"org/debian/lkajan/mobxTutorial/model/MobxModel/Validation"
], function(MessagePopover, MessagePopoverItem, Controller, JSONModel, ControlMessageProcessor, TypeString, ParseException,
	ValidateException, ListBinding, models, __mobx, MobxModel, Validation) {
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

			var that = this;

			// Domain model
			var oDomainModel = models.createDomainModel(
				this.getOwnerComponent().getModel("i18n").getResourceBundle()
			);
			this.getView().setModel(oDomainModel, "domain");

			// Application model
			var oAppModel = new MobxModel(__mobx.observable({
				get canSubmit() {
					return this.validateDomainCallResult && that.oObservableValidation.results.length === 0;
				},
				get messageCount() {
					return this.validationMessages.length;
				},
				validateDomainCallResult: false,
				validationMessages: []
			}));
			this.getView().setModel(oAppModel);

			// Message management
			var oMessageManager = sap.ui.getCore().getMessageManager(),
				oMessageProcessor = new ControlMessageProcessor();
			oMessageManager.registerMessageProcessor(oMessageProcessor);
			oMessageManager.registerObject(this.getView(), true); // Handle validation for this view

			//	Flatten validation results: transform domain model to validation array
			this.oObservableValidation = __mobx.observable({
				results: [] // will be replaced by transformation to observable array
			});
			this._fAutorunDisposerObservableValidation = __mobx.reaction(
				Validation.transformModelToValidationArray.bind(this, oDomainModel.getObservable()),
				function(aValidationResults) {
					this.oObservableValidation.results = aValidationResults;
				}.bind(this), {
					fireImmediately: true
				}
			);

			//	Transform validation array to validation message array
			this.oObservableValidationMessages = __mobx.observable({
				messages: []
			});
			this._fAutorunDisposerObservableValidationMessages = __mobx.reaction(
				function() {
					return Validation.transformValidationArrayToValidationMessages(this.oObservableValidation.results);
				}.bind(this),
				function(aValidationMessages) {
					this.oObservableValidationMessages.messages = aValidationMessages;
				}.bind(this), {
					fireImmediately: true
				}
			);

			//	Merge messages when validation message array changes
			this._fAutorunDisposerValidationArrayMerge = __mobx.reaction(
				function() {
					return this.oObservableValidationMessages.messages.peek();
				}.bind(this),
				this._mergeMessageModelMessages.bind(this), // changes oAppModel
				{
					fireImmediately: true
				}
			);

			//	Merge messages when oMessageManager message model changes
			this._oMessageModelBinding = new ListBinding(oMessageManager.getMessageModel(), "/");
			this._oMessageModelBinding.attachChange(this._mergeMessageModelMessages, this);

			oMessagePopover.setModel(oAppModel);
		},

		onExit: function() {
			this._fAutorunDisposerValidationArrayMerge();
			this._fAutorunDisposerObservableValidationMessages();
			this._fAutorunDisposerObservableValidation();
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
		},

		onValidationMessagesPress: function(oEvent) {

			oMessagePopover.toggle(oEvent.getSource());
		},

		onPressAddDwarf: function(oEvent) {

			var oDomainObservable = this.getView().getModel("domain").getObservable();

			if (oDomainObservable.DwarfCount < 3) {
				var oDwarf = models.createDwarf();
				oDomainObservable.Dwarfs.push(oDwarf);
			}
		},

		onPressRemoveDwarf: function(oEvent) {

			var oDomainObservable = this.getView().getModel("domain").getObservable();

			if (oDomainObservable.DwarfCount > 0) {
				--oDomainObservable.Dwarfs.length;
			}
		},

		formatterValueStateFieldPair: function(val1, val2) {
			if (val1) {
				return val1.valid ? val2.valueState : val1.valueState;
			} else {
				return "None"; // When the model is not yet assigned, we get val1 === null
			}
		},

		formatterValueStateTextFieldPair: function(val1, val2) {
			if (val1) {
				return val1.valid ? val2.valueStateText : val1.valueStateText;
			} else {
				return "None"; // When the model is not yet assigned, we get val1 === null
			}
		},

		validateDomain: function() {

			try {
				var bValid = true;

				// Now reactive // bValid = bValid && this._validateInput("inputSWFirstName");
				// Now reactive // bValid = bValid && this._validateInput("inputSWLastName");
				bValid = bValid && this._validateInput("inputSWAge");

				this.getView().getModel().setProperty("/validateDomainCallResult", bValid);
			} catch (oEx) {
				this.getView().getModel().setProperty("/validateDomainCallResult", false);
				throw oEx;
			}
		},

		_mergeMessageModelMessages: function() {

			var oMessageManager = sap.ui.getCore().getMessageManager();

			this.getView().getModel().getObservable().validationMessages =
				oMessageManager.getMessageModel().getData().concat(this.oObservableValidationMessages.messages.peek());
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