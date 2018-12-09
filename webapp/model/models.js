sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"org/js/mobx/mobx.umd.min",
	"sap/ui/mobx/MobxModel",
	"sap/ui/model/type/String",
	"org/debian/lkajan/mobxTutorial/model/type/raw/StringWithApple",
	"sap/ui/mobxValidation/TypeFactory",
	"sap/ui/mobxValidation/Utils"
], function(JSONModel, Device, __mobx, MobxModel, String, RawStringWithApple, TypeFactory, Validation) {
	"use strict";

	var MobxModelTypeString = TypeFactory.createExtendedType(String, "org.debian.lkajan.mobxTutorial.model.type.String");
	var MobxModelTypeStringWithApple = TypeFactory.createExtendedType(RawStringWithApple,
		"org.debian.lkajan.mobxTutorial.model.type.StringWithApple");

	var models = {
		oMobxModelTypeStringName: new MobxModelTypeString({}, {
			search: /^(|[^0-9\s]{3,})$/
		}),
		oMobxModelTypeStringWithApple: new MobxModelTypeStringWithApple({}, {
			search: /^(|[^0-9\s]{3,})$/
		}),

		createDeviceModel: function() {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		createDomainModel: function(oI18nResourceBundle) {
			var state = __mobx.observable.object({
				SnowWhite: {
					// Note: though not obligatory, it's a good idea to initialize the names, because otherwise we get RegExp matching errors like
					//	`Cannot read property 'search' of undefined`
					FirstName: "",
					//FirstNameWithApple: "", // TODO: make a better example
					LastName: "",
					// Computed
					get FullName() {
						return (this.FirstName ? (this.FirstName + (this.LastName ? " " : "")) : "") + (this.LastName || "");
					},
					get FullName$Changed() { // Indicates "changed by user"
						// Note: must use __mobx.get() in case property is not guaranteed to exist in the model, like here.
						//	Note: __mobx.get() doesn't work on computed properties (!).
						return __mobx.get(this, "FirstName$Changed") || __mobx.get(this, "LastName$Changed");
					},
					get FullName$Validation() {

						var bValid = this.FirstName$Validation.valid && this.LastName$Validation.valid && Boolean(this.FullName);
						return {
							valid: bValid,
							valueState: bValid ? "None" : (__mobx.get(this, "FullName$Changed") || state.$ignoreChanged ? "Error" : "None"),
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
			// Validation
			Validation.reactionByTypeChanged(state.SnowWhite, "FirstName", this.oMobxModelTypeStringName, "string", state, "$ignoreChanged");
			// Validation.reactionByTypeChanged(state.SnowWhite, "FirstNameWithApple", this.oMobxModelTypeStringWithApple, "string", state, "$ignoreChanged"); // TODO
			Validation.reactionByTypeChanged(state.SnowWhite, "LastName", this.oMobxModelTypeStringName, "string", state, "$ignoreChanged");

			// // Dwarf handling
			// // Idea: provide help with adding the ($Changed and) $Validation property
			// __mobx.observe(state, "Dwarfs", function(change0) { // Returns a disposer
			// 	if (change0.type === "update") {
			// 		__mobx.intercept(state.Dwarfs, function(change) {
			// 			// New dwarf(s) added
			// 			if (change.type === "splice" && change.added.length) {
			// 				var oDwarfExtension = {
			// 					get FullName() {
			// 						return (this.FirstName ? (this.FirstName + (this.LastName ? " " : "")) : "") + (this.LastName || "");
			// 					},
			// 					get FullName$Changed() { // Indicates "changed by user"
			// 						return __mobx.get(this, "FirstName$Changed") || __mobx.get(this, "LastName$Changed");
			// 					},
			// 					get FullName$Validation() {
			// 						var bValid = this.FirstName$Validation.valid && this.LastName$Validation.valid && Boolean(this.FullName);
			// 						return {
			// 							valid: bValid,
			// 							valueState: bValid ? "None" : (__mobx.get(this, "FullName$Changed") || state.$ignoreChanged ? "Error" : "None"),
			// 							valueStateText: bValid ? "" : oI18nResourceBundle.getText("atLeastCorrectFirstOrLast")
			// 						};
			// 					}
			// 				};

			// 				for (var i = 0; i < change.added.length; ++i) {
			// 					if (!__mobx.isObservableObject(change.added[i])) {
			// 						change.added[i] = __mobx.observable(change.added[i]);
			// 					}
			// 					var oDwarf = change.added[i];
			// 					__mobx.extendObservable(oDwarf, oDwarfExtension);

			// 					Validation.reactionByTypeChanged(oDwarf, "FirstName", this.oMobxModelTypeStringName, "string", state, "$ignoreChanged");
			// 					Validation.reactionByTypeChanged(oDwarf, "LastName", this.oMobxModelTypeStringName, "string", state, "$ignoreChanged");
			// 				}
			// 			}
			// 			return change;
			// 		}.bind(this));
			// 	}
			// }.bind(this), true); // fireImmediately

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