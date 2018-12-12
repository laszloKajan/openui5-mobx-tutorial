sap.ui.define([
	"sap/m/MessagePopover",
	"sap/m/MessagePopoverItem", // Deprecated, use MessageItem
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/message/ControlMessageProcessor",
	"sap/ui/model/type/String",
	"sap/ui/model/ParseException",
	"sap/ui/model/ValidateException",
	"sap/ui/model/ListBinding",
	"org/debian/lkajan/mobxTutorial/model/models",
	"org/js/mobx/mobx.umd.min",
	"org/js/mobxUtils/mobx-utils.umd",
	"sap/ui/mobx/MobxModel",
	"sap/ui/mobxValidation/Utils",
	"sap/ui/core/message/Message"
], function(MessagePopover, MessageItem, Controller, JSONModel, ControlMessageProcessor, TypeString, ParseException,
	ValidateException, ListBinding, models, __mobx, __mobxUtils, MobxModel, Validation, Message) {
	"use strict";

	// TODO: removeme
	// var fTransformValidationToMessage = __mobxUtils.createTransformer(function(oValidation) { // Current value, index, array
	// 	return new Message({
	// 		message: oValidation.valueStateText.replace(/([{}])/g, "\\$1"),
	// 		type: oValidation.valueState,
	// 		validation: true
	// 	});
	// });

	// var fFilterValidationToMessage = function(oValidation) {
	// 	return oValidation.valueState !== "None";
	// };

	// var _transformValidationArrayToValidationMessages = __mobxUtils.createTransformer(function(aSource) {
	// 		return aSource.filter(fFilterValidationToMessage).map(fTransformValidationToMessage);
	// 	});

	return Controller.extend("org.debian.lkajan.mobxTutorial.controller.Application", {

		onInit: function() {

			var that = this;

			// Domain model
			var oModelDomain = models.createDomainModel(
				this.getOwnerComponent().getModel("i18n").getResourceBundle()
			);
			this.getView().setModel(oModelDomain, "domain");
			var oObservableDomain = oModelDomain.getObservable();

			// Application model
			var oModelApp = new MobxModel(__mobx.observable({
				get canSubmit() {
					return this.validateDomainCallResult && that.oObservableValidation.results.length === 0;
				},
				messageModelMessageCount: undefined,
				// TODO: review messageCount: should be updated when message model message count changes
				// get messageCount() {
				// 	return this.validationMessages.length;
				// },
				validateDomainCallResult: false,
				validationMessages: []
			}));
			this.getView().setModel(oModelApp);

			// Validation results to MessageManager (reaction)
			Validation.messageManager.reactionValidationMsg(this, oModelDomain, "/SnowWhite/FirstName", "inputSWFirstName");
			Validation.messageManager.reactionValidationMsg(this, oModelDomain, "/SnowWhite/FirstNameWithApple", "inputSWFirstNameWithApple");
			Validation.messageManager.reactionValidationMsg(this, oModelDomain, "/SnowWhite/LastName", "inputSWLastName");
			Validation.messageManager.reactionValidationMsg(this, oModelDomain, "/SnowWhite/FullName", "inputSWFirstName");

			// Validation results of Dwarfs: done where dwarfs are added

			// Overall validity
			//	Flatten validation results: transform domain model to validation array
			this.oObservableValidation = __mobx.observable({
				results: [] // will be replaced by transformation to observable array
			});
			this._disposerObservableValidation = __mobx.reaction(
				Validation.transformModelToValidationArray.bind(this, oObservableDomain),
				function(aValidationResults) {
					this.oObservableValidation.results = aValidationResults;
				}.bind(this), {
					fireImmediately: true
				}
			);

			// var oMessageManager = sap.ui.getCore().getMessageManager(),
			// TODO: removeme
			// 	oMessageProcessor = new ControlMessageProcessor();
			// oMessageManager.registerMessageProcessor(oMessageProcessor);
			// oMessageManager.registerObject(this.getView(), true); // Handle validation for this view

			// //	Flatten validation results: transform domain model to validation array
			// this.oObservableValidation = __mobx.observable({
			// 	results: [] // will be replaced by transformation to observable array
			// });
			// this._fAutorunDisposerObservableValidation = __mobx.reaction(
			// 	Validation.transformModelToValidationArray.bind(this, oModelDomain.getObservable()),
			// 	function(aValidationResults) {
			// 		this.oObservableValidation.results = aValidationResults;
			// 	}.bind(this), {
			// 		fireImmediately: true
			// 	}
			// );

			// //	Transform validation array to validation message array
			// this.oObservableValidationMessages = __mobx.observable({
			// 	messages: []
			// });
			// this._fAutorunDisposerObservableValidationMessages = __mobx.reaction(
			// 	function() {
			// 		return _transformValidationArrayToValidationMessages(this.oObservableValidation.results);
			// 	}.bind(this),
			// 	function(aValidationMessages) {
			// 		this.oObservableValidationMessages.messages = aValidationMessages;
			// 	}.bind(this), {
			// 		fireImmediately: true
			// 	}
			// );

			// //	Merge messages when validation message array changes
			// this._fAutorunDisposerValidationArrayMerge = __mobx.reaction(
			// 	function() {
			// 		return this.oObservableValidationMessages.messages.peek(); // Returns an array with all the values
			// 	}.bind(this),
			// 	this._mergeMessageModelMessages.bind(this), // changes oModelApp
			// 	{
			// 		fireImmediately: true
			// 	}
			// );

			// Count messages when oMessageManager message model changes
			var oMessageManager = sap.ui.getCore().getMessageManager();
			this._oMessageModelBinding = new ListBinding(oMessageManager.getMessageModel(), "/");
			this._oMessageModelBinding.attachChange(this._onMessageModelChange, this);

			// Reactive controls
			this._fDisposerMessageCount = __mobx.reaction(function() {
					return this.getView().getModel().getObservable().messageModelMessageCount;
				}.bind(this),
				function(nMessageCount) {
					var oControl = this.byId("btnMessagePopup");
					oControl.setText(nMessageCount > 0 ? nMessageCount : "");
					oControl.setType(nMessageCount > 0 ? "Emphasized" : "Default");
				}.bind(this), {
					fireImmediately: true,
					delay: 1
				});

			// 3rd dwarf visibility
			__mobx.reaction(function() {
					return this.getView().getModel("domain").getObservable().DwarfCount;
				}.bind(this),
				function(nDwarfCount) {
					["formElementDwarf2", "formElementDwarf2-1", "formElementDwarf2-2"].forEach(function(sId) {
						var oControl = this.byId(sId);
						if (oControl) {
							oControl.setVisible(nDwarfCount >= 3);
						}
					}.bind(this));
				}.bind(this), {
					fireImmediately: true,
					delay: 1
				});

			// __mobx.reaction(function() {
			// 	var oDwarf = __mobx.get(this.getView().getModel("domain").getObservable().Dwarfs, 2);
			// 	return oDwarf ? {
			// 		firstNameValidation: oDwarf.FirstName$Validation,
			// 		fullNameValidation: oDwarf.FullName$Validation
			// 	} : undefined;
			// }.bind(this), function(oValidation) {
			// 	var oControlFirstName = this.byId("inputD2FirstName");

			// 	if (oValidation) {

			// 		oControlFirstName.setValueState(this.formatterValueStateFieldPair(oValidation.firstNameValidation, oValidation.fullNameValidation));
			// 		oControlFirstName.setValueStateText(this.formatterValueStateTextFieldPair(oValidation.firstNameValidation, oValidation.fullNameValidation));
			// 	} else {

			// 		// oControlFirstName.setValueState("None");
			// 		// oControlFirstName.setValueStateText("None");
			// 	}
			// }.bind(this), {
			// 	fireImmediately: true,
			// 	delay: 1
			// });

			// // TODO: reviseme
			// __mobx.reaction(function() {
			// 	var oDwarf = __mobx.get(this.getView().getModel("domain").getObservable().Dwarfs, 2);
			// 	return oDwarf ? {
			// 		lastNameValidation: oDwarf.LastName$Validation,
			// 		fullNameValidation: oDwarf.FullName$Validation
			// 	} : undefined;
			// }.bind(this), function(oValidation) {
			// 	var oControlLastName = this.byId("inputD2LastName");

			// 	if (oValidation) {

			// 		oControlLastName.setValueState(this.formatterValueStateFieldPair(oValidation.lastNameValidation, oValidation.fullNameValidation));
			// 		oControlLastName.setValueStateText(this.formatterValueStateTextFieldPair(oValidation.lastNameValidation, oValidation.fullNameValidation));
			// 	} else {

			// 		// oControlLastName.setValueState("None");
			// 		// oControlLastName.setValueStateText("None");
			// 	}
			// }.bind(this), {
			// 	fireImmediately: true,
			// 	delay: 1
			// });
		},

		onExit: function() {
			Validation.messageManager.removeAllMessages(this);

			this._fDisposerMessageCount();
			// // TODO: removeme
			// this._fAutorunDisposerValidationArrayMerge();
			// this._fAutorunDisposerObservableValidationMessages();
			// this._fAutorunDisposerObservableValidation();
			// this._oMessageModelBinding.detachChange(this._mergeMessageModelMessages, this);
			// this._oMessageModelBinding.destroy();
		},

		onChangeSetChanged: function(oEvent) {

			var s = oEvent.getSource(),
				sProperty;

			switch (s.getMetadata().getName()) {
				case "sap.m.Select":
					sProperty = "selectedKey";
					break;
				default:
					sProperty = "value";
			}

			var oBinding = oEvent.getSource().getBinding(sProperty);
			if (oBinding.getBindings && oBinding.getBindings().length) { // composite binding
				oBinding = oBinding.getBindings()[0];
			}

			var oModel = oBinding.getModel();
			var sPath = oBinding.getPath();

			oModel.setProperty(sPath + "$Changed", true);
			// oModel.setProperty(sPath + "$Changed", window.performance.now());
		},

		onChangeRevalidate: function(oEvent) {

			this.validateDomain();
		},

		onFixSWFirstName: function() {

			this.getView().getModel("domain").setProperty("/SnowWhite/FirstName", "Snow");
		},

		onMessagesIndicatorPress: function(oEvent) {
			var oMessagesButton = oEvent.getSource();
			if (!this._messagePopover) {
				this._messagePopover = new MessagePopover({
					items: {
						path: "message>/",
						// Consider filtering, or removal of messages when user navigates away
						// filters: new Filter("target", "EQ", "/TransferSet(guid'E83935A8-4054-1EE3-AEE7-2B5E42289997')"),
						template: new MessageItem({
							type: "{message>type}",
							title: "{message>message}",
							subtitle: "{message>code}",
							// description:,
							// markupDescription:,
							longtextUrl: "{message>descriptionUrl}"
								// counter:,
								// groupName:
						})
					}
				});
				this._messagePopover.setModel(sap.ui.getCore().getMessageManager().getMessageModel(), "message");
				oMessagesButton.addDependent(this._messagePopover); // No need to destroy a dependent
			}
			this._messagePopover.toggle(oMessagesButton);
		},

		onPressAddDwarf: function(oEvent) {

			var oModelDomain = this.getView().getModel("domain"),
				oDomainObservable = oModelDomain.getObservable();

			if (oDomainObservable.DwarfCount < 3) {
				var oDwarf = models.createDwarf();
				oDomainObservable.Dwarfs.push(oDwarf);

				// Validation results of Dwarfs
				var nDwarfIdx = oDomainObservable.Dwarfs.length - 1;
				Validation.messageManager.reactionValidationMsg(this, oModelDomain, "/Dwarfs/" + nDwarfIdx + "/FirstName",
					"inputD" + nDwarfIdx + "FirstName");
				Validation.messageManager.reactionValidationMsg(this, oModelDomain, "/Dwarfs/" + nDwarfIdx + "/LastName",
					"inputD" + nDwarfIdx + "LastName");
				Validation.messageManager.reactionValidationMsg(this, oModelDomain, "/Dwarfs/" + nDwarfIdx + "/FullName",
					"inputD" + nDwarfIdx + "FirstName");
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

		_onMessageModelChange: function() {

			var oMessageManager = sap.ui.getCore().getMessageManager();

			this.getView().getModel().getObservable().messageModelMessageCount =
				oMessageManager.getMessageModel().getData().length;
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