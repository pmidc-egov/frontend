import {
  getCommonCard,
  getCommonTitle,
  getTextField,
  getSelectField,
  getCommonContainer,
  getCommonParagraph,
  getPattern,
  getDateField,
  getLabel,
  getCommonHeader,
  getCommonGrayCard,
  getCommonSubHeader
} from "egov-ui-framework/ui-config/screens/specs/utils";
//   import { searchApiCall } from "./functions";
import commonConfig from "config/common.js";
import {
  handleScreenConfigurationFieldChange as handleField,
  prepareFinalObject
} from "egov-ui-framework/ui-redux/screen-configuration/actions";
import { getHeaderSideText } from "../../utils";
import get from 'lodash/get';
import { httpRequest } from '../../../../../ui-utils/index';
import set from 'lodash/set';
import { getTodaysDateInYMD, getQueryArg, getObjectKeys, getObjectValues } from 'egov-ui-framework/ui-utils/commons';
import { isModifyMode } from "../../../../../ui-utils/commons";
let isMode = isModifyMode();

const getPlumberRadioButton = {
  uiFramework: "custom-containers-local",
  moduleName: "egov-wns",
  componentPath: "RadioGroupContainer",
  gridDefination: { xs: 12, sm: 12 },
  jsonPath: "applyScreen.additionalDetails.detailsProvidedBy",
  props: {
    label: { key: "WS_ADDN_DETAILS_PLUMBER_PROVIDED_BY" },
    buttons: [
      { labelKey: "WS_PLUMBER_ULB", value: "ULB" },
      { labelKey: "WS_PLUMBER_SELF", value: "Self" },
    ],
    required: false
  },
  type: "array"
};
export const triggerUpdateByKey = (state, keyIndex, value, dispatch) => {
  if(dispatch == "set"){
    set(state, `screenConfiguration.preparedFinalObject.DynamicMdms.ws-services-masters.waterSource.selectedValues[${keyIndex}]`, value);
  } else {
    dispatch(prepareFinalObject( `DynamicMdms.ws-services-masters.waterSource.${keyIndex}`, value ));
  }
}
export const updateWaterSource = async ( state, dispatch ) => {  
  const waterSource = get( state, "screenConfiguration.preparedFinalObject.WaterConnection[0].waterSource", null);
  const waterSubSource = get( state, "screenConfiguration.preparedFinalObject.WaterConnection[0].waterSubSource", null);
  let modValue = waterSource + "." + waterSubSource;
  let i = 0;
  let formObj = {
    waterSourceType: waterSource, waterSubSource: modValue
  }
  triggerUpdateByKey(state, i, formObj, 'set');

  triggerUpdateByKey(state, `waterSubSourceTransformed.allDropdown[${i}]`, getObjectValues(get( state, `screenConfiguration.preparedFinalObject.DynamicMdms.ws-services-masters.waterSource.waterSourceTransformed.${waterSource}`, [])) , dispatch);

  triggerUpdateByKey(state, `selectedValues[${i}]`, formObj , dispatch);
} 
const waterSourceTypeChange = (reqObj) => {
  try {
      let { dispatch, value, state } = reqObj;
      dispatch(prepareFinalObject("WaterConnection[0].waterSource", value));
      dispatch(prepareFinalObject("WaterConnection[0].waterSubSource", ''));
      let formObj = {
        waterSourceType: value, waterSubSource: ''
      }
      triggerUpdateByKey(state, `selectedValues[0]`, formObj , dispatch);
  } catch (e) {
    console.log(e);
  }
}
const waterSubSourceChange = (reqObj) => {
  try {
      let { dispatch, value } = reqObj;
      let rowValue = value.split(".");
      dispatch(prepareFinalObject("WaterConnection[0].waterSubSource", rowValue[1]));
  } catch (e) {
    console.log(e);
  }
}
export const commonRoadCuttingChargeInformation = () => {
  return getCommonGrayCard({
    roadDetails: getCommonContainer({
      roadType: getSelectField({
        label: {
          labelName: "Road Type",
          labelKey: "WS_ADDN_DETAIL_ROAD_TYPE"
        },
        placeholder: {
          labelKey: "WS_ADDN_DETAILS_ROAD_TYPE_PLACEHOLDER"
        },
        localePrefix: {
          moduleName: "WS",
          masterName: "ROADTYPE"
        },
        required: false,
        sourceJsonPath: "applyScreenMdmsData.sw-services-calculation.RoadType",
        gridDefination: {
          xs: 12,
          sm: 6
        },
        required: false,
        errorMessage: "ERR_INVALID_BILLING_PERIOD",
        jsonPath: "applyScreen.roadCuttingInfo[0].roadType",
        props: {
          jsonPath: "applyScreen.roadCuttingInfo[0].roadType"
        }
      }),
      enterArea: getTextField({
        label: {
          labelKey: "WS_ADDN_DETAILS_AREA_LABEL"
        },
        placeholder: {
          labelKey: "WS_ADDN_DETAILS_AREA_PLACEHOLDER"
        },
        gridDefination: {
          xs: 12,
          sm: 6
        },
        required: false,
        pattern: getPattern("Amount"),
        errorMessage: "ERR_DEFAULT_INPUT_FIELD_MSG",
        jsonPath: "applyScreen.roadCuttingInfo[0].roadCuttingArea"
      })
    })
  })
}
export const additionDetails = getCommonCard({
  header: getCommonHeader({
    labelKey: "WS_COMMON_ADDN_DETAILS_HEADER"
  }),
  connectiondetailscontainer: getCommonGrayCard({
    subHeader: getCommonTitle({
      labelKey: "WS_COMMON_CONNECTION_DETAILS"
    }),

    connectionDetails: getCommonContainer({
      connectionType: {
        ...getSelectField({
          label: { labelKey: "WS_SERV_DETAIL_CONN_TYPE" },
          placeholder: { labelKey: "WS_ADDN_DETAILS_CONN_TYPE_PLACEHOLDER" },
          required: false,
          sourceJsonPath: "applyScreenMdmsData.ws-services-masters.connectionType",
          gridDefination: { xs: 12, sm: 6 },
          errorMessage: "ERR_INVALID_BILLING_PERIOD",
          jsonPath: "applyScreen.connectionType"
        }),
        afterFieldChange: async (action, state, dispatch) => {
          let connType = await get(state, "screenConfiguration.preparedFinalObject.applyScreen.connectionType");
          console.log('connType');
          console.log(connType);
          if (connType === undefined || connType === "Non Metered" || connType === "Bulk-supply" || connType !== "Metered") {
            showHideFeilds(dispatch, false);
          }
          else {
            showHideFeilds(dispatch, true);
          }
          if (connType === "Metered") {
            console.log("=========", connType);
            dispatch(
              handleField(
                "apply",
                "components.div.children.formwizardThirdStep.children.additionDetails.children.cardContent.children.connectiondetailscontainer.children.cardContent.children.connectionDetails.children.billingType",
                "props.value",
                "STANDARD"
              ),
            )
              dispatch(
                handleField(
                  "apply",
                  "components.div.children.formwizardThirdStep.children.additionDetails.children.cardContent.children.connectiondetailscontainer.children.cardContent.children.connectionDetails.children.billingType",
                  "props.disabled",
                  true
                )
              )
          }
          else{
            dispatch(
              handleField(
                "apply",
                "components.div.children.formwizardThirdStep.children.additionDetails.children.cardContent.children.connectiondetailscontainer.children.cardContent.children.connectionDetails.children.billingType",
                "props.disabled",
                false
              )
            ),
            dispatch(
              handleField(
                "apply",
                "components.div.children.formwizardThirdStep.children.additionDetails.children.cardContent.children.connectiondetailscontainer.children.cardContent.children.connectionDetails.children.billingAmount",
                "visible",
                true
              )
            );
          }
          if(connType === "Bulk-supply"){
            dispatch(
              handleField(
                "apply",
                "components.div.children.formwizardThirdStep.children.additionDetails.children.cardContent.children.connectiondetailscontainer.children.cardContent.children.connectionDetails.children.billingType",
                "visible",
                false
              )
            ),
            dispatch(
              handleField(
                "apply",
                "components.div.children.formwizardThirdStep.children.additionDetails.children.cardContent.children.connectiondetailscontainer.children.cardContent.children.connectionDetails.children.billingAmount",
                "visible",
                false
              )
            );
          }
          else{
            dispatch(
              handleField(
                "apply",
                "components.div.children.formwizardThirdStep.children.additionDetails.children.cardContent.children.connectiondetailscontainer.children.cardContent.children.connectionDetails.children.billingType",
                "visible",
                true
              )
            ),
            dispatch(
              handleField(
                "apply",
                "components.div.children.formwizardThirdStep.children.additionDetails.children.cardContent.children.connectiondetailscontainer.children.cardContent.children.connectionDetails.children.billingAmount",
                "visible",
                true
              )
            );
          }
        }
      },
      billingType: {
        ...getSelectField({
          label: { labelKey: "WS_SERV_DETAIL_BILLING_TYPE" },
          placeholder: { labelKey: "WS_SERV_DETAIL_BILING_TYPE_PLACEHOLDER" },
          required: false,
          sourceJsonPath: "applyScreenMdmsData.ws-services-masters.billingType",
          gridDefination: { xs: 12, sm: 6 },
          errorMessage: "ERR_INVALID_BILLING_PERIOD",
          jsonPath: "applyScreen.additionalDetails.billingType",
          props: {
            disabled: false
          }
        }),
        afterFieldChange: async (action, state, dispatch) => {
          let billingType = await get(state, "screenConfiguration.preparedFinalObject.applyScreen.additionalDetails.billingType");
          let connType = await get(state, "screenConfiguration.preparedFinalObject.applyScreen.connectionType");

          console.log('billingType');
          console.log(billingType);
          if (billingType != "CUSTOM") {
            dispatch(
              handleField(
                "apply",
                "components.div.children.formwizardThirdStep.children.additionDetails.children.cardContent.children.connectiondetailscontainer.children.cardContent.children.connectionDetails.children.billingAmount",
                "visible",
                false
              )
            );
          }
          else {
            dispatch(
              handleField(
                "apply",
                "components.div.children.formwizardThirdStep.children.additionDetails.children.cardContent.children.connectiondetailscontainer.children.cardContent.children.connectionDetails.children.billingAmount",
                "visible",
                true
              )
            );
          }

        }
      },
      numberOfTaps: getTextField({
        label: { labelKey: "WS_SERV_DETAIL_NO_OF_TAPS" },
        placeholder: { labelKey: "WS_SERV_DETAIL_NO_OF_TAPS_PLACEHOLDER" },
        gridDefination: { xs: 12, sm: 6 },
        jsonPath: "applyScreen.noOfTaps",
        pattern: /^[0-9]*$/i,
        errorMessage: "ERR_DEFAULT_INPUT_FIELD_MSG",
      }),
      billingAmount: getTextField({
        label: { labelKey: "WS_SERV_DETAIL_BILLING_AMOUNT" },
        placeholder: { labelKey: "WS_SERV_DETAIL_BILLING_AMOUNT_PLACEHOLDER" },
        gridDefination: { xs: 12, sm: 6 },
        jsonPath: "applyScreen.additionalDetails.billingAmount",
        pattern: /^[0-9]*$/i,
        errorMessage: "ERR_DEFAULT_INPUT_FIELD_MSG",
      }),
      connectionCategory: getSelectField({
        label: { labelKey: "WS_SERV_CONNECTION_CATEGORY" },
        placeholder: { labelKey: "WS_SERV_CONNECTION_CATEGORY_PLACEHOLDER" },
        gridDefination: { xs: 12, sm: 6 },
        sourceJsonPath: "applyScreenMdmsData.ws-services-masters.connectionCategory",
        jsonPath: "applyScreen.additionalDetails.connectionCategory",
        // pattern: /^[0-9]*$/i,
        errorMessage: "ERR_DEFAULT_INPUT_FIELD_MSG"
      }),
      ledgerId: getTextField({
        label: { labelKey: "WS_SERV_DETAIL_LEDGER_ID" },
        placeholder: { labelKey: "WS_SERV_DETAIL_LEDGER_ID_PLACEHOLDER" },
        gridDefination: { xs: 12, sm: 6 },
        jsonPath: "applyScreen.additionalDetails.ledgerId",
        // pattern: /^[0-9]*$/i,
        errorMessage: "ERR_DEFAULT_INPUT_FIELD_MSG",
      }),
      dynamicMdmsWaterSource : {
        uiFramework: "custom-containers",
        componentPath: "DynamicMdmsContainer",
        props: {
          dropdownFields: [
            {
              key : 'waterSourceType',
              callBack: waterSourceTypeChange 
            },
            // {
            //   key : 'waterSubSource',
            //   callBack: waterSubSourceChange 
            // }
          ],
          moduleName: "ws-services-masters",
          masterName: "waterSource",
          rootBlockSub : 'waterSource',
          callBackEdit: updateWaterSource
        }
      },
      pipeSize: getSelectField({
        label: { labelKey: "WS_SERV_DETAIL_PIPE_SIZE" },
        placeholder: { labelKey: "WS_SERV_DETAIL_PIPE_SIZE_PLACEHOLDER" },
        gridDefination: { xs: 12, sm: 6 },
        sourceJsonPath: "applyScreenMdmsData.ws-services-calculation.pipeSize",
        jsonPath: "applyScreen.pipeSize",
        pattern: /^[0-9]*$/i,
        errorMessage: "ERR_DEFAULT_INPUT_FIELD_MSG"
      }),

      noOfWaterClosets: getTextField({
        label: { labelKey: "WS_ADDN_DETAILS_NO_OF_WATER_CLOSETS" },
        placeholder: { labelKey: "WS_ADDN_DETAILS_NO_OF_WATER_CLOSETS_PLACEHOLDER" },
        gridDefination: { xs: 12, sm: 6 },
        jsonPath: "applyScreen.noOfWaterClosets",
        pattern: /^[0-9]*$/i,
        errorMessage: "ERR_DEFAULT_INPUT_FIELD_MSG"
      }),
      noOfToilets: getTextField({
        label: { labelKey: "WS_ADDN_DETAILS_NO_OF_TOILETS" },
        placeholder: { labelKey: "WS_ADDN_DETAILS_NO_OF_TOILETS_PLACEHOLDER" },
        gridDefination: { xs: 12, sm: 6 },
        jsonPath: "applyScreen.noOfToilets",
        pattern: /^[0-9]*$/i,
        errorMessage: "ERR_DEFAULT_INPUT_FIELD_MSG"
      }),
      subUsageType: {
        ...getSelectField({
          label: { labelKey: "WS_SERV_DETAIL_SUB_USAGE_TYPE" },
          placeholder: { labelKey: "WS_SERV_DETAIL_SUB_USAGE_TYPE_PLACEHOLDER" },
          required: true,
          sourceJsonPath: "applyScreenMdmsData.ws-services-masters.subUsageType",
          gridDefination: { xs: 12, sm: 6 },
          errorMessage: "ERR_INVALID_BILLING_PERIOD",
          jsonPath: "applyScreen.additionalDetails.waterSubUsageType",
          props: {
            disabled: false
          }
        }),
       
      },
      unitUsageType: {
        ...getSelectField({
          label: { labelKey: "WS_SERV_DETAIL_UNIT_USAGE_TYPE" },
          placeholder: { labelKey: "WS_SERV_DETAIL_UNIT_USAGE_TYPE_PLACEHOLDER" },
          required: true,
          sourceJsonPath: "unitUsageTypeMdmsData.ws-services-masters.unitUsageType",
          gridDefination: { xs: 12, sm: 6 },
          errorMessage: "ERR_INVALID_BILLING_PERIOD",
          jsonPath: "applyScreen.additionalDetails.unitUsageType",
          props: {
            disabled: false
          }
        }),

      }
    }),
  }),
  plumberDetailsContainer: getCommonGrayCard({
    subHeader: getCommonTitle({
      labelKey: "WS_COMMON_PLUMBER_DETAILS"
    }),
    plumberDetails: getCommonContainer({
      getPlumberRadioButton,
      plumberLicenceNo: getTextField({
        label: {
          labelKey: "WS_ADDN_DETAILS_PLUMBER_LICENCE_NO_LABEL"
        },
        placeholder: {
          labelKey: "WS_ADDN_DETAILS_PLUMBER_LICENCE_NO_PLACEHOLDER"
        },
        gridDefination: {
          xs: 12,
          sm: 6
        },
        required: false,
        pattern: /^[0-9]*$/i,
        errorMessage: "ERR_DEFAULT_INPUT_FIELD_MSG",
        jsonPath: "applyScreen.plumberInfo[0].licenseNo"
      }),
      plumberName: getTextField({
        label: {
          labelKey: "WS_ADDN_DETAILS_PLUMBER_NAME_LABEL"
        },
        placeholder: {
          labelKey: "WS_ADDN_DETAILS_PLUMBER_NAME_PLACEHOLDER"
        },
        gridDefination: {
          xs: 12,
          sm: 6
        },
        required: false,
        pattern: getPattern("Name"),
        errorMessage: "ERR_DEFAULT_INPUT_FIELD_MSG",
        jsonPath: "applyScreen.plumberInfo[0].name"
      }),
      plumberMobNo: getTextField({
        label: {
          labelKey: "WS_ADDN_DETAILS_PLUMBER_MOB_NO_LABEL"
        },
        placeholder: {
          labelKey: "WS_ADDN_DETAILS_PLUMBER_MOB_NO_LABEL_PLACEHOLDER"
        },
        gridDefination: { xs: 12, sm: 6 },
        iconObj: { label: "+91 |", position: "start" },
        required: false,
        pattern: getPattern("MobileNo"),
        errorMessage: "ERR_DEFAULT_INPUT_FIELD_MSG",
        jsonPath: "applyScreen.plumberInfo[0].mobileNumber"
      }),
    })
  }),
  roadCuttingChargeContainer: getCommonGrayCard({
    header: getCommonSubHeader(
      {
        labelName: "Road Cutting Charge",
        labelKey: "WS_ROAD_CUTTING_CHARGE_DETAILS"
      },
      {
        style: {
          marginBottom: 18
        }
      }
    ),
    applicantTypeContainer: getCommonContainer({
      roadCuttingChargeInfoCard : {
        uiFramework: "custom-atoms",
        componentPath: "Div",
        props: {
          style: {
            // display: "none"
            // width: 
          }
        },
        children: {
          multipleApplicantInfo: {
            uiFramework: "custom-containers",
            componentPath: "MultiItem",
            props: {
              scheama: commonRoadCuttingChargeInformation(),
              items: [],
              addItemLabel: {
                labelName: "Add Road Type",
                labelKey: "WS_ADD_ROAD_TYPE_LABEL"
              },
              isReviewPage: false,
              sourceJsonPath: "applyScreen.roadCuttingInfo",
              prefixSourceJsonPath: "children.cardContent.children.roadDetails.children"
            },
            type: "array"
          }
        }
      },
    }),
    roadDetails: getCommonContainer({
      compositionFee: getTextField({
        label: {
          labelKey: "WS_ADDN_DETAILS_COMPOSITION_LABEL"
        },
        placeholder: {
          labelKey: "WS_ADDN_DETAILS_COMPOSITION_PLACEHOLDER"
        },
        gridDefination: {
          xs: 12,
          sm: 6
        },
        required: false,
        pattern: getPattern("Amount"),
        errorMessage: "ERR_DEFAULT_INPUT_FIELD_MSG",
        jsonPath: "applyScreen.additionalDetails.compositionFee"
      }),
      userCharges: getTextField({
        label: {
          labelKey: "WS_ADDN_USER_CHARGES_LABEL"
        },
        placeholder: {
          labelKey: "WS_ADDN_USER_CHARGES_PLACEHOLDER"
        },
        gridDefination: {
          xs: 12,
          sm: 6
        },
        required: false,
        pattern: getPattern("Amount"),
        errorMessage: "ERR_DEFAULT_INPUT_FIELD_MSG",
        jsonPath: "applyScreen.additionalDetails.userCharges"
      }),
      othersFee : getTextField({
        label: {
          labelKey: "WS_ADDN_OTHER_FEE_LABEL"
        },
        placeholder: {
          labelKey: "WS_ADDN_OTHER_FEE_PLACEHOLDER"
        },
        gridDefination: {
          xs: 12,
          sm: 6
        },
        required: false,
        pattern: getPattern("Amount"),
        errorMessage: "ERR_DEFAULT_INPUT_FIELD_MSG",
        jsonPath: "applyScreen.additionalDetails.othersFee"
      })
    }),
  }),
  activationDetailsContainer: getCommonGrayCard({
    subHeader: getCommonTitle({
      labelKey: "WS_ACTIVATION_DETAILS"
    }),
    activeDetails: getCommonContainer({
      connectionExecutionDate: getDateField({
        label: { labelName: "connectionExecutionDate", labelKey: "WS_SERV_DETAIL_CONN_EXECUTION_DATE" },
        // placeholder: {
        //   labelName: "Select From Date",
        //   labelKey: "WS_FROM_DATE_PLACEHOLDER"
        // },
        gridDefination: {
          xs: 12,
          sm: 6
        },
        required: false,
        pattern: getPattern("Date"),
        errorMessage: "ERR_INVALID_DATE",
        jsonPath: "applyScreen.connectionExecutionDate"
      }),
      meterID: getTextField({
        label: {
          labelKey: "WS_SERV_DETAIL_METER_ID"
        },
        placeholder: {
          labelKey: "WS_ADDN_DETAILS_METER_ID_PLACEHOLDER"
        },
        gridDefination: {
          xs: 12,
          sm: 6
        },
        required: false,
        pattern: /^[a-z0-9]+$/i,
        errorMessage: "ERR_DEFAULT_INPUT_FIELD_MSG",
        jsonPath: "applyScreen.meterId"
      }),
      meterInstallationDate: getDateField({
        label: { labelName: "meterInstallationDate", labelKey: "WS_ADDN_DETAIL_METER_INSTALL_DATE" },
        // placeholder: {
        //   labelName: "Select From Date",
        //   labelKey: "WS_FROM_DATE_PLACEHOLDER"
        // },
        gridDefination: {
          xs: 12,
          sm: 6
        },
        required: false,
        pattern: getPattern("Date"),
        errorMessage: "ERR_INVALID_DATE",
        jsonPath: "applyScreen.meterInstallationDate"
      }),
      initialMeterReading: getTextField({
        label: {
          labelKey: "WS_ADDN_DETAILS_INITIAL_METER_READING"
        },
        placeholder: {
          labelKey: "WS_ADDN_DETAILS_INITIAL_METER_READING_PLACEHOLDER"
        },
        gridDefination: {
          xs: 12,
          sm: 6
        },
        required: false,
        pattern: /^[0-9]\d{0,9}(\.\d{1,3})?%?$/,
        errorMessage: "ERR_DEFAULT_INPUT_FIELD_MSG",
        jsonPath: "applyScreen.additionalDetails.initialMeterReading"
      }),
      meterMake: getTextField({
        label: {
          labelKey: "WS_ADDN_DETAILS_INITIAL_METER_MAKE"
        },
        placeholder: {
          labelKey: "WS_ADDN_DETAILS_INITIAL_METER_MAKE_PLACEHOLDER"
        },
        gridDefination: {
          xs: 12,
          sm: 6
        },
        required: false,
        pattern: /^[0-9]\d{0,9}(\.\d{1,3})?%?$/,
        errorMessage: "ERR_DEFAULT_INPUT_FIELD_MSG",
        jsonPath: "applyScreen.additionalDetails.meterMake"
      }),
      averageMake: getTextField({
        label: {
          labelKey: "WS_ADDN_DETAILS_INITIAL_AVERAGE_MAKE"
        },
        placeholder: {
          labelKey: "WS_ADDN_DETAILS_INITIAL_AVERAGE_MAKE_PLACEHOLDER"
        },
        gridDefination: {
          xs: 12,
          sm: 6
        },
        required: false,
        pattern: /^[0-9]\d{0,9}(\.\d{1,3})?%?$/,
        errorMessage: "ERR_DEFAULT_INPUT_FIELD_MSG",
        jsonPath: "applyScreen.additionalDetails.avarageMeterReading"
      })
    })
  }),
  modificationsEffectiveFrom : getCommonGrayCard({
    subHeader: getCommonTitle({
      labelKey: "WS_MODIFICATIONS_EFFECTIVE_FROM"
    }),
    modificationEffectiveDate: getCommonContainer({
      connectionExecutionDate: getDateField({
        label: { labelName: "Modifications Effective Date", labelKey: "MODIFICATIONS_EFFECTIVE_DATE" },
        gridDefination: {
          xs: 12,
          sm: 6
        },
        required: false,
        pattern: getPattern("Date"),
        errorMessage: "ERR_INVALID_DATE",
        jsonPath: "applyScreen.dateEffectiveFrom",
        props: {
          inputProps: {
            min: getTodaysDateInYMD()
          }
        }
      }),
      
    })
  })
});

const showHideFeilds = (dispatch, value) => {
  let mStep = (isModifyMode()) ? 'formwizardSecondStep' : 'formwizardThirdStep'; 
  dispatch(
    handleField(
      "apply",
      `components.div.children.${mStep}.children.additionDetails.children.cardContent.children.activationDetailsContainer.children.cardContent.children.activeDetails.children.initialMeterReading`,
      "visible",
      value
    )
  );
  dispatch(
    handleField(
      "apply",
      `components.div.children.${mStep}.children.additionDetails.children.cardContent.children.activationDetailsContainer.children.cardContent.children.activeDetails.children.meterInstallationDate`,
      "visible",
      value
    )
  );
  dispatch(
    handleField(
      "apply",
      `components.div.children.${mStep}.children.additionDetails.children.cardContent.children.activationDetailsContainer.children.cardContent.children.activeDetails.children.meterID`,
      "visible",
      value
    )
  );
  dispatch(
    handleField(
      "apply",
      `components.div.children.formwizardThirdStep.children.additionDetails.children.cardContent.children.activationDetailsContainer.children.cardContent.children.activeDetails.children.initialMeterReading`,
      "visible",
      value
    )
  );
  dispatch(
    handleField(
      "apply",
      `components.div.children.formwizardThirdStep.children.additionDetails.children.cardContent.children.activationDetailsContainer.children.cardContent.children.activeDetails.children.meterInstallationDate`,
      "visible",
      value
    )
  );
  dispatch(
    handleField(
      "apply",
      `components.div.children.formwizardThirdStep.children.additionDetails.children.cardContent.children.activationDetailsContainer.children.cardContent.children.activeDetails.children.meterID`,
      "visible",
      value
    )
  );
  dispatch(
    handleField(
      "apply",
      "components.div.children.formwizardFourthStep.children.summaryScreen.children.cardContent.children.reviewOwnerDetails.children.cardContent.children.viewThirteen.children.reviewInitialMeterReading",
      "visible",
      value
    )
  );
  dispatch(
    handleField(
      "apply",
      "components.div.children.formwizardFourthStep.children.summaryScreen.children.cardContent.children.reviewOwnerDetails.children.cardContent.children.viewThirteen.children.reviewMeterInstallationDate",
      "visible",
      value
    )
  );
  dispatch(
    handleField(
      "apply",
      "components.div.children.formwizardFourthStep.children.summaryScreen.children.cardContent.children.reviewOwnerDetails.children.cardContent.children.viewThirteen.children.reviewMeterId",
      "visible",
      value
    )
  );
}

