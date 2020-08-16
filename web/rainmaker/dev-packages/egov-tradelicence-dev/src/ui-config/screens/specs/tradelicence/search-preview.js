import {
  getCommonHeader,
  getCommonCard,
  getCommonTitle,
  getCommonGrayCard,
  getCommonContainer,
  getLabel
} from "egov-ui-framework/ui-config/screens/specs/utils";
import {
  handleScreenConfigurationFieldChange as handleField,
  prepareFinalObject
} from "egov-ui-framework/ui-redux/screen-configuration/actions";
import {
  getQueryArg,
  setBusinessServiceDataToLocalStorage,setDocuments
} from "egov-ui-framework/ui-utils/commons";
import { getSearchResults } from "../../../../ui-utils/commons";
import {
  createEstimateData,
  setMultiOwnerForSV,
  showHideAdhocPopup,
  setValidToFromVisibilityForSV,
  getDialogButton
} from "../utils";
import { downloadPrintContainer,footerReviewTop  } from "./applyResource/footer";
import {
  getFeesEstimateCard,
  getHeaderSideText,
  getTransformedStatus
} from "../utils";
import { getReviewTrade } from "./applyResource/review-trade";
import { getReviewOwner } from "./applyResource/review-owner";
import { getReviewDocuments } from "./applyResource/review-documents";
import { loadReceiptGenerationData } from "../utils/receiptTransformer";
import get from "lodash/get";
import set from "lodash/set";
import { fetchLocalizationLabel } from "egov-ui-kit/redux/app/actions";
import { getLocale} from "egov-ui-kit/utils/localStorageUtils";
import { httpRequest } from "../../../../ui-utils";
import { adhocPopup } from "./applyResource/adhocPopup";

const tenantId = getQueryArg(window.location.href, "tenantId");
let applicationNumber = getQueryArg(window.location.href, "applicationNumber");
let headerSideText = { word1: "", word2: "" };


const getTradeTypeSubtypeDetails = payload => {
  const tradeUnitsFromApi = get(
    payload,
    "Licenses[0].tradeLicenseDetail.tradeUnits",
    []
  );
  const tradeUnitDetails = [];
  tradeUnitsFromApi.forEach(tradeUnit => {
    const { tradeType } = tradeUnit;
    const tradeDetails = tradeType.split(".");
    tradeUnitDetails.push({
      trade: get(tradeDetails, "[0]", ""),
      tradeType: get(tradeDetails, "[1]", ""),
      tradeSubType: get(tradeDetails, "[2]", "")
    });
  });
  return tradeUnitDetails;
};

const searchResults = async (action, state, dispatch, applicationNo) => {
  let queryObject = [
    { key: "tenantId", value: tenantId },
    { key: "applicationNumber", value: applicationNo }
  ];
  let payload = await getSearchResults(queryObject);

  headerSideText = getHeaderSideText(
    get(payload, "Licenses[0].status"),
    get(payload, "Licenses[0].licenseNumber")
  );
  let rebateAmount = get(payload, "Licenses[0].tradeLicenseDetail.adhocExemption");
  set(payload, "Licenses[0].headerSideText", headerSideText);
  set(payload, "Licenses[0].assignee", []);
  get(payload, "Licenses[0].tradeLicenseDetail.subOwnerShipCategory") &&
  get(payload, "Licenses[0].tradeLicenseDetail.subOwnerShipCategory").split(
    "."
  )[0] === "INDIVIDUAL"
    ? setMultiOwnerForSV(action, true)
    : setMultiOwnerForSV(action, false);

  if (get(payload, "Licenses[0].licenseType")) {
    setValidToFromVisibilityForSV(
      action,
      get(payload, "Licenses[0].licenseType")
    );
  }
  if(rebateAmount && rebateAmount < 0){
    set(payload, "Licenses[0].tradeLicenseDetail.adhocExemption", -rebateAmount);
  }

  await setDocuments(
    payload,
    "Licenses[0].tradeLicenseDetail.applicationDocuments",
    "LicensesTemp[0].reviewDocData",
    dispatch,'TL'
  );

  let sts = getTransformedStatus(get(payload, "Licenses[0].status"));
  payload && dispatch(prepareFinalObject("Licenses[0]", payload.Licenses[0]));

  //set business service data
    
  const businessService = get(
    state.screenConfiguration.preparedFinalObject,
    "Licenses[0].workflowCode"
  );
  const businessServiceQueryObject = [
    { key: "tenantId", value: tenantId },
    {
      key: "businessServices",
      value: businessService ? businessService : "NewTL"
    }
  ];

  await setBusinessServiceDataToLocalStorage(businessServiceQueryObject, dispatch);

  //set Trade Types

  payload &&
    dispatch(
      prepareFinalObject(
        "LicensesTemp[0].tradeDetailsResponse",
        getTradeTypeSubtypeDetails(payload)
      )
    );
  const LicenseData = payload.Licenses[0];
  const fetchFromReceipt = sts !== "pending_payment";

    
  // generate estimate data
  createEstimateData(
    LicenseData,
    "LicensesTemp[0].estimateCardData",
    dispatch,
    {},
    fetchFromReceipt
  );
};

const beforeInitFn = async (action, state, dispatch, applicationNumber) => {
  //Search details for given application Number
  if (applicationNumber) {
    !getQueryArg(window.location.href, "edited") &&
      (await searchResults(action, state, dispatch, applicationNumber));

   //check for renewal flow
    const licenseNumber = get(
      state.screenConfiguration.preparedFinalObject,
      `Licenses[0].licenseNumber`
    );
    let queryObjectSearch = [
      {
        key: "tenantId",
        value: tenantId 
      },
      { key: "offset", value: "0" },
      { key: "licenseNumbers", value: licenseNumber}
    ];
    const payload = await getSearchResults(queryObjectSearch);
    const length = payload && payload.Licenses.length > 0 ? get(payload,`Licenses`,[]).length : 0;
    dispatch(prepareFinalObject("licenseCount" ,length));
    const status = get(
      state,
      "screenConfiguration.preparedFinalObject.Licenses[0].status"
    );

    const financialYear = get(
      state,
      "screenConfiguration.preparedFinalObject.Licenses[0].financialYear"
    );

    let data = get(state, "screenConfiguration.preparedFinalObject");

    const obj = setStatusBasedValue(status);
    if (get(data, "Licenses[0].tradeLicenseDetail.applicationDocuments")) {
      await setDocuments(
        data,
        "Licenses[0].tradeLicenseDetail.applicationDocuments",
        "LicensesTemp[0].reviewDocData",
        dispatch,'TL'
      );
    }

    const businessService = get(
      state.screenConfiguration.preparedFinalObject,
      `Licenses[0].businessService`
    );
    let mdmsBody = {
      MdmsCriteria: {
        tenantId: tenantId,
        moduleDetails: [
          {
            moduleName: "common-masters",
            masterDetails: [{ name: "uiCommonPay",filter: `[?(@.code=="${businessService}")]` }]
          }
        ]
      }
    };
    try {
      let payload = null;
      payload = await httpRequest(
        "post",
        "/egov-mdms-service/v1/_search",
        "_search",
        [],
        mdmsBody
      );
      console.log("payload...",payload)
      dispatch(prepareFinalObject("uiCommonConfig", get(payload.MdmsRes , "common-masters.uiCommonPay[0]")));
    } catch (e) {
      console.log(e);
    }

    const statusCont = {
      word1: {
        ...getCommonTitle(
          {
            jsonPath: "Licenses[0].headerSideText.word1"
          },
          {
            style: {
              marginRight: "10px",
              color: "rgba(0, 0, 0, 0.6000000238418579)"
            }
          }
        )
      },
      word2: {
        ...getCommonTitle({
          jsonPath: "Licenses[0].headerSideText.word2"
        })
      },
      cancelledLabel: {
        ...getCommonHeader(
          {
            labelName: "Cancelled",
            labelKey: "TL_COMMON_STATUS_CANC"
          },
          { variant: "body1", style: { color: "#E54D42" } }
        ),
        visible: false
      }
    };

    const printCont = downloadPrintContainer(
      action,
      state,
      dispatch,
      status,
      applicationNumber,
      tenantId
    );
    const CitizenprintCont=footerReviewTop(
      action,
      state,
      dispatch,
      status,
      applicationNumber,
      tenantId,
      financialYear
    );

    if(status !== "INITIATED"){
      process.env.REACT_APP_NAME === "Citizen"
      ? set(
          action,
          "screenConfig.components.div.children.headerDiv.children.helpSection.children",
          CitizenprintCont
        )
      : set(
          action,
          "screenConfig.components.div.children.headerDiv.children.helpSection.children",
          printCont
        );
    }   

    // Get approval details based on status and set it in screenconfig

    if (
      status === "APPROVED" ||
      status === "REJECTED" ||
      status === "CANCELLED"
    ) {
      set(
        action,
        "screenConfig.components.div.children.tradeReviewDetails.children.cardContent.children.approvalDetails.visible",
        true
      );

      if (get(data, "Licenses[0].tradeLicenseDetail.verificationDocuments")) {
        await setDocuments(
          data,
          "Licenses[0].tradeLicenseDetail.verificationDocuments",
          "LicensesTemp[0].verifyDocData",
          dispatch,'TL'
        );
      } else {
        dispatch(
          handleField(
            "search-preview",
            "components.div.children.tradeReviewDetails.children.cardContent.children.approvalDetails.children.cardContent.children.viewTow.children.lbl",
            "visible",
            false
          )
        );
      }
    } else {
      set(
        action,
        "screenConfig.components.div.children.tradeReviewDetails.children.cardContent.children.approvalDetails.visible",
        false
      );
    }
    
    const applicationType = get(
      state.screenConfiguration.preparedFinalObject,
      "Licenses[0].applicationType"
    );
   
    const headerrow = getCommonContainer({
      header: getCommonHeader({
        labelName: "Trade License Application (2018-2019)",
        labelKey: applicationType === "RENEWAL"? "TL_TRADE_RENEW_APPLICATION":"TL_TRADE_APPLICATION"
      }),
    applicationLicence:getCommonContainer({
      applicationNumber: {
        uiFramework: "custom-atoms-local",
        moduleName: "egov-tradelicence",
        componentPath: "ApplicationNoContainer",
        props: {
          number: applicationNumber
        }
      },
      licenceNumber: {
        uiFramework: "custom-atoms-local",
        moduleName: "egov-tradelicence",
        componentPath: "licenceNoContainer",
        visible: licenseNumber? true : false,
        props: {
          number: licenseNumber,
        }
      }
    })
    });
    set(
      action.screenConfig,
      "components.div.children.headerDiv.children.header1.children.headertop",
      headerrow
    );

 
    // const footer = footerReview(
    //   action,
    //   state,
    //   dispatch,
    //   status,
    //   applicationNumber,
    //   tenantId,
    //   financialYear
    // );

    // process.env.REACT_APP_NAME === "Citizen"
    //   ? set(action, "screenConfig.components.div.children.footer", footer)
    //   : set(action, "screenConfig.components.div.children.footer", {});

    if (status === "cancelled")
      set(
        action,
        "screenConfig.components.div.children.headerDiv.children.helpSection.children.cancelledLabel.visible",
        true
      );       
    setActionItems(action, obj);
    loadReceiptGenerationData(applicationNumber, tenantId);
  }
};

let titleText = "";

const setStatusBasedValue = status => {
  switch (status) {
    case "approved":
      return {
        titleText: "Review the Trade License",
        titleKey: "TL_REVIEW_TRADE_LICENSE",
        titleVisibility: true,
        roleDefination: {
          rolePath: "user-info.roles",
          roles: ["TL_APPROVER"]
        }
      };
    case "pending_payment":
      return {
        titleText: "Review the Application and Proceed",
        titleKey: "TL_REVIEW_APPLICATION_AND_PROCEED",
        titleVisibility: true,
        roleDefination: {
          rolePath: "user-info.roles",
          roles: ["TL_CEMP"]
        }
      };
    case "pending_approval":
      return {
        titleText: "Review the Application and Proceed",
        titleKey: "TL_REVIEW_APPLICATION_AND_PROCEED",
        titleVisibility: true,
        roleDefination: {
          rolePath: "user-info.roles",
          roles: ["TL_APPROVER"]
        }
      };
    case "cancelled":
      return {
        titleText: "",
        titleVisibility: false,
        roleDefination: {}
      };
    case "rejected":
      return {
        titleText: "",
        titleVisibility: false,
        roleDefination: {}
      };

    default:
      return {
        titleText: "",
        titleVisibility: false,
        roleDefination: {}
      };
  }
};

const headerrow = getCommonContainer({
});

const estimate = getCommonGrayCard({
  estimateSection: getFeesEstimateCard({
    sourceJsonPath: "LicensesTemp[0].estimateCardData"
  })
});

const reviewTradeDetails = getReviewTrade(false);

const reviewOwnerDetails = getReviewOwner(false);

const reviewDocumentDetails = getReviewDocuments(false, false);

// let approvalDetails = getApprovalDetails(status);
let title = getCommonTitle({ labelName: titleText });

const setActionItems = (action, object) => {
  set(
    action,
    "screenConfig.components.div.children.tradeReviewDetails.children.cardContent.children.title",
    getCommonTitle({
      labelName: get(object, "titleText"),
      labelKey: get(object, "titleKey")
    })
  );
  set(
    action,
    "screenConfig.components.div.children.tradeReviewDetails.children.cardContent.children.title.visible",
    get(object, "titleVisibility")
  );
  set(
    action,
    "screenConfig.components.div.children.tradeReviewDetails.children.cardContent.children.title.roleDefination",
    get(object, "roleDefination")
  );
};

export const tradeReviewDetails = getCommonCard({
  title,
  estimate,
  addPenaltyRebateButton: {
    componentPath: "Button",
    props: {
      color: "primary",
      style: {}
    },
    children: {
      previousButtonLabel: getLabel({
        labelName: "ADD REBATE/PENALTY",
        labelKey: "TL_PAYMENT_ADD_RBT_PEN"
      })
    },
    onClickDefination: {
      action: "condition",
      callBack: showHideAdhocPopup
    },
    roleDefination: {
      rolePath: "user-info.roles",
      roles: ["TL_APPROVER","TL_DOC_VERIFIER"]
    }
  },
  viewBreakupButton: getDialogButton(
    "VIEW BREAKUP",
    "TL_PAYMENT_VIEW_BREAKUP",
    "search-preview"
  ),
  reviewTradeDetails,
  reviewOwnerDetails,
  reviewDocumentDetails
});

const screenConfig = {
  uiFramework: "material-ui",
  name: "search-preview",
  beforeInitScreen: (action, state, dispatch) => {
    applicationNumber = getQueryArg(window.location.href, "applicationNumber");
    const tenantId = getQueryArg(window.location.href, "tenantId");
    dispatch(fetchLocalizationLabel(getLocale(), tenantId, tenantId));
    //To set the application no. at the  top
    set(
      action.screenConfig,
      "components.div.children.headerDiv.children.header1.children.applicationNumber.props.number",
      applicationNumber
    );
    beforeInitFn(action, state, dispatch, applicationNumber);
    return action;
  },

  components: {
    div: {
      uiFramework: "custom-atoms",
      componentPath: "Div",
      props: {
        className: "common-div-css search-preview"
      },
      children: {
        headerDiv: {
          uiFramework: "custom-atoms",
          componentPath: "Container",
          children: {
            header1: {
              gridDefination: {
                xs: 12,
                sm: 8
              },
          
             ...headerrow

            },
            helpSection: {
              uiFramework: "custom-atoms",
              componentPath: "Container",
              props: {
                color: "primary",
                style: { justifyContent: "flex-end" }
              },
              gridDefination: {
                xs: 12,
                sm: 4,
                align: "right"
              }
            }
          }
        },
        taskStatus: {
          uiFramework: "custom-containers-local",
          componentPath: "WorkFlowContainer",
          moduleName: "egov-workflow",
          // visible: process.env.REACT_APP_NAME === "Citizen" ? false : true,
          props: {
            dataPath: "Licenses",
            moduleName: "NewTL",
            updateUrl: "/tl-services/v1/_update",
            beforeSubmitHook:
              (data) =>{
                 let rebateAmount = data[0].tradeLicenseDetail.adhocExemption;
                 if(rebateAmount && rebateAmount > 0){
                   data = set(data, "[0].tradeLicenseDetail.adhocExemption", -rebateAmount);
                 }
                 return data;
              }
          }
        },
        // actionDialog: {
        //   uiFramework: "custom-containers-local",
        //   componentPath: "ResubmitActionContainer",
        //   moduleName: "egov-tradelicence",
        //   visible: process.env.REACT_APP_NAME === "Citizen" ? true : false,
        //   props: {
        //     open: true,
        //     dataPath: "Licenses",
        //     moduleName: "NewTL",
        //     updateUrl: "/tl-services/v1/_update",
        //     data: {
        //       buttonLabel: "RESUBMIT",
        //       moduleName: "NewTL",
        //       isLast: false,
        //       dialogHeader: {
        //         labelName: "RESUBMIT Application",
        //         labelKey: "WF_RESUBMIT_APPLICATION"
        //       },
        //       showEmployeeList: false,
        //       roles: "CITIZEN",
        //       isDocRequired: false
        //     }
        //   }
        // },
        tradeReviewDetails
      }
    },
    breakUpDialog: {
      uiFramework: "custom-containers-local",
      moduleName: "egov-tradelicence",
      componentPath: "ViewBreakupContainer",
      props: {
        open: false,
        maxWidth: "md",
        screenKey: "search-preview"
      }
    },
    adhocDialog: {
      uiFramework: "custom-containers-local",
      moduleName: "egov-tradelicence",
      componentPath: "DialogContainer",
      props: {
        open: false,
        maxWidth: "sm",
        screenKey: "search-preview"
      },
      children: {
        popup: adhocPopup
      }
    }
  }
};

export default screenConfig;
