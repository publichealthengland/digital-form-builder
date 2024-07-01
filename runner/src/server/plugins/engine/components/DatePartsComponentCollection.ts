import joi, { Schema as JoiSchema } from "joi";
import { ComponentDef } from "@xgovformbuilder/model";
import * as Components from "./index";
import { FormModel } from "../models/FormModel";

export class DatePartsComponentCollection {
  items: (ComponentBase | ComponentCollection | FormComponent)[];
  formItems: Components.FormComponent /* | ConditionalFormComponent*/[];
  prePopulatedItems: Record<string, JoiSchema>;
  formSchema: JoiSchema;
  stateSchema: JoiSchema;

  constructor(componentDefs: ComponentDef[] = [], model: FormModel) {
    const components = componentDefs.map((def) => {
      const Comp: any = Components[def.type];

      if (typeof Comp !== "function") {
        throw new Error(`Component type ${def.type} doesn't exist`);
      }

      return new Comp(def, model);
    });

    const formComponents = components.filter(
      (component) => component.isFormComponent
    );

    this.items = components;
    this.formItems = formComponents;
    // this.formSchema = joi
    //   .object()
    //   .keys(this.getFormSchemaKeys())
    //   .required()
    //   .keys({ crumb: joi.string().optional().allow("") });
    // this needs to be custom for day month year

    this.stateSchema = joi.object().keys(this.getStateSchemaKeys()).required();

    // this.prePopulatedItems = this.getPrePopulatedItems();
  }

  getFormSchemaKeys() {
    const keys = {};

    this.formItems.forEach((item) => {
      Object.assign(keys, item.getFormSchemaKeys());
    });

    return keys;
  }

  customDateValidation(value, helpers, baseName) {
    const day = value[`${baseName}__day`];
    const month = value[`${baseName}__month`];
    const year = value[`${baseName}__year`];

    if (day || month || year) {
      if (!day) {
        return helpers.error("any.custom", {
          message: `${baseName}__day is required when month or year is present`,
        });
      }
      if (!month) {
        return helpers.error("any.custom", {
          message: `${baseName}__month is required when day or year is present`,
        });
      }
      if (!year) {
        return helpers.error("any.custom", {
          message: `${baseName}__year is required when day or month is present`,
        });
      }
    }

    return value;
  }

  getStateSchemaKeys() {
    const keys = {};
    // this.formItems.forEach((item) => {
    //   const { name } = this.name;
    //   const baseName = name.split("__")[0];

    //   // const schema = joi.object({
    //   //   [`${baseName}__day`]: joi.string().allow(""),
    //   //   [`${baseName}__month`]: joi.string().allow(""),
    //   //   [`${baseName}__year`]: joi.string().allow(""),
    //   // });
    //   // .custom(
    //   //   (value, helpers) => this.customDateValidation(value, helpers, baseName),
    //   //   "custom date validation"
    //   // );

    //   Object.assign(keys, {
    //     [`${baseName}__day`]: joi.string().allow(""),
    //     [`${baseName}__month`]: joi.string().allow(""),
    //     [`${baseName}__year`]: joi.string().allow(""),
    //   });
    // });

    return keys;
  }

  getPrePopulatedItems() {
    return this.formItems
      .filter((item) => item.options?.allowPrePopulation)
      .map((item) => {
        // to access the schema we need to use the component name to retrieve the value from getStateSchemaKeys
        const schema = item.getStateSchemaKeys()[item.name];

        return {
          [item.name]: {
            schema,
            allowPrePopulationOverwrite:
              item.options.allowPrePopulationOverwrite,
          },
        };
      })
      .reduce((acc, curr) => merge(acc, curr), {});
  }

  getFormDataFromState(state: FormSubmissionState): any {
    const formData = {};

    this.formItems.forEach((item) => {
      Object.assign(formData, item.getFormDataFromState(state));
    });

    return formData;
  }

  getStateFromValidForm(payload: FormPayload): { [key: string]: any } {
    const state = {};

    this.formItems.forEach((item) => {
      Object.assign(state, item.getStateFromValidForm(payload));
    });

    return state;
  }

  getViewModel(
    formData: FormData | FormSubmissionState,
    errors?: FormSubmissionErrors,
    conditions?: FormModel["conditions"]
  ): ComponentCollectionViewModel {
    const result =
      this.items?.map((item: any) => {
        return {
          type: item.type,
          isFormComponent: item.isFormComponent,
          model: item.getViewModel(formData, errors),
        };
      }) ?? [];

    if (conditions) {
      return result.filter(
        (item) => conditions[item.model?.condition]?.fn(formData) ?? true
      );
    }

    return result;
  }
}
