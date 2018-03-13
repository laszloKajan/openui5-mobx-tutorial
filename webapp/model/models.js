sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"org/js/mobx/3.5.1/mobx.umd.min",
	"sap/ui/mobx/MobxModel",
	"sap/ui/model/type/String",
	"org/debian/lkajan/mobxTutorial/model/type/raw/StringWithApple",
	"org/debian/lkajan/mobxTutorial/model/MobxModel/TypeFactory",
	"org/debian/lkajan/mobxTutorial/model/MobxModel/Validation"
], function(JSONModel, Device, __mobx, MobxModel, String, RawStringWithApple, TypeFactory, Validation) {
	"use strict";

	var MobxModelTypeString = TypeFactory.createExtendedType(String, "org.debian.lkajan.mobxTutorial.model.type.String");
	var oMobxModelTypeStringName = new MobxModelTypeString({}, {
		search: /^(|[^0-9\s]{3,})$/
	});

	var MobxModelTypeStringWithApple = TypeFactory.createExtendedType(RawStringWithApple,
		"org.debian.lkajan.mobxTutorial.model.type.StringWithApple");
	var oMobxModelTypeStringWithApple = new MobxModelTypeStringWithApple({}, {
		search: /^(|[^0-9\s]{3,})$/
	});

	var models = {
		createDeviceModel: function() {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		createDomainModel: function(oI18nResourceBundle) {
			var state = __mobx.observable({
				SnowWhite: {
					FirstName: "",
					FirstName$Changed: false,
					get FirstName$Validation() {
						return Validation.getModelPropertyValidationByType(this, "FirstName", oMobxModelTypeStringName, "string", state.$ignoreChanged);
					},
					get FirstName$WithApple$Validation() {
						return Validation.getModelPropertyValidationByType(this, "FirstName", oMobxModelTypeStringWithApple, "string", state.$ignoreChanged);
					},

					LastName: "",
					LastName$Changed: false,
					get LastName$Validation() {
						return Validation.getModelPropertyValidationByType(this, "LastName", oMobxModelTypeStringName, "string", state.$ignoreChanged);
					},
					//
					get FullName() {
						return (this.FirstName ? (this.FirstName + (this.LastName ? " " : "")) : "") + (this.LastName || "");
					},
					get FullName$Changed() { // Indicates "changed by user"
						return this.FirstName$Changed || this.LastName$Changed;
					},
					get FullName$Validation() {

						var bValid = this.FirstName$Validation.valid && this.LastName$Validation.valid && Boolean(this.FullName);
						return {
							valid: bValid,
							valueState: bValid ? "None" : (this.FullName$Changed || state.$ignoreChanged ? "Error" : "None"),
							valueStateText: bValid ? "" : oI18nResourceBundle.getText("atLeastCorrectFirstOrLast")
						};
					},
					//
					Age: undefined
				},
				Dwarfs: [],
				get DwarfCount() {
					return this.Dwarfs.length;
				},
				//
				$ignoreChanged: false // If true, set $Validation.valueState regardless of $Changed state
			});

			// Dwarf handling
			__mobx.observe(state, "Dwarfs", function(change0) { // Returns a disposer
				if (change0.type === "update") {
					__mobx.intercept(state.Dwarfs, function(change) {
						// New dwarf(s) added
						if (change.type === "splice" && change.added.length) {
							var oDwarfExtension = {
								FirstName$Changed: false,
								get FirstName$Validation() {
									return Validation.getModelPropertyValidationByType(this, "FirstName", oMobxModelTypeStringName, "string", state.$ignoreChanged);
								},
								//
								LastName$Changed: false,
								get LastName$Validation() {
									return Validation.getModelPropertyValidationByType(this, "LastName", oMobxModelTypeStringName, "string", state.$ignoreChanged);
								},
								//
								get FullName() {
									return (this.FirstName ? (this.FirstName + (this.LastName ? " " : "")) : "") + (this.LastName || "");
								},
								get FullName$Changed() { // Indicates "changed by user"
									return this.FirstName$Changed || this.LastName$Changed;
								},
								get FullName$Validation() {
									var bValid = this.FirstName$Validation.valid && this.LastName$Validation.valid && Boolean(this.FullName);
									return {
										valid: bValid,
										valueState: bValid ? "None" : (this.FullName$Changed || state.$ignoreChanged ? "Error" : "None"),
										valueStateText: bValid ? "" : oI18nResourceBundle.getText("atLeastCorrectFirstOrLast")
									};
								}
							};

							for (var i = 0; i < change.added.length; ++i) {
								if (!__mobx.isObservableObject(change.added[i])) {
									change.added[i] = __mobx.observable(change.added[i]);
								}
								var oDwarf = change.added[i];
								__mobx.extendObservable(oDwarf, oDwarfExtension);
							}
						}
						return change;
					});
				}
			}, true); // invokeImmediately

			var oModel = new MobxModel(state);
			return oModel;
		},

		createDwarf: function() {
			return {
				FirstName: "",
				LastName: ""
			};
		}
	};
	return models;
});