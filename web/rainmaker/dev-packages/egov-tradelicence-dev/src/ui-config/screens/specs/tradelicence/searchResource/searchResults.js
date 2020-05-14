import React from "react";
import { Link } from "react-router-dom";
import get from "lodash/get";
import { sortByEpoch, getEpochForDate,getTextToLocalMapping } from "../../utils";
import {
  getLocaleLabels,
  getTransformedLocalStorgaeLabels
} from "egov-ui-framework/ui-utils/commons";

import {
  getLocalization,
  getTenantId
} from "egov-ui-kit/utils/localStorageUtils";

export const textToLocalMapping = {
  "Application No": getLocaleLabels(
    "Application No",
    "TL_COMMON_TABLE_COL_APP_NO",
    getTransformedLocalStorgaeLabels()
  ),

  "License No": getLocaleLabels(
    "License No",
    "TL_COMMON_TABLE_COL_LIC_NO",
    getTransformedLocalStorgaeLabels()
  ),

  "Trade Name": getLocaleLabels(
    "Trade Name",
    "TL_COMMON_TABLE_COL_TRD_NAME",
    getTransformedLocalStorgaeLabels()
  ),
  "Owner Name": getLocaleLabels(
    "Owner Name",
    "TL_COMMON_TABLE_COL_OWN_NAME",
    getTransformedLocalStorgaeLabels()
  ),

  "Application Date": getLocaleLabels(
    "Application Date",
    "TL_COMMON_TABLE_COL_APP_DATE",
    getTransformedLocalStorgaeLabels()
  ),

  Status: getLocaleLabels(
    "Status",
    "TL_COMMON_TABLE_COL_STATUS",
    getTransformedLocalStorgaeLabels()
  ),

  INITIATED: getLocaleLabels(
    "Initiated,",
    "TL_INITIATED",
    getTransformedLocalStorgaeLabels()
  ),
  APPLIED: getLocaleLabels(
    "Applied",
    "TL_APPLIED",
    getTransformedLocalStorgaeLabels()
  ),
  PAID: getLocaleLabels(
    "Paid",
    "WF_NEWTL_PENDINGAPPROVAL",
    getTransformedLocalStorgaeLabels()
  ),

  APPROVED: getLocaleLabels(
    "Approved",
    "TL_APPROVED",
    getTransformedLocalStorgaeLabels()
  ),
  REJECTED: getLocaleLabels(
    "Rejected",
    "TL_REJECTED",
    getTransformedLocalStorgaeLabels()
  ),
  CANCELLED: getLocaleLabels(
    "Cancelled",
    "TL_CANCELLED",
    getTransformedLocalStorgaeLabels()
  ),
  PENDINGAPPROVAL: getLocaleLabels(
    "Pending for Approval",
    "WF_NEWTL_PENDINGAPPROVAL",
    getTransformedLocalStorgaeLabels()
  ),
  PENDINGPAYMENT: getLocaleLabels(
    "Pending payment",
    "WF_NEWTL_PENDINGPAYMENT",
    getTransformedLocalStorgaeLabels()
  ),

  FIELDINSPECTION: getLocaleLabels(
    "Pending for Field Inspection",
    "WF_NEWTL_FIELDINSPECTION",
    getTransformedLocalStorgaeLabels()
  ),

  "Search Results for Trade License Applications": getLocaleLabels(
    "",
    "TL_HOME_SEARCH_RESULTS_TABLE_HEADING",
    getTransformedLocalStorgaeLabels()
  )
};

export const searchResults = {
  uiFramework: "custom-molecules",
  // moduleName: "egov-tradelicence",
  componentPath: "Table",
  visible: false,
  props: {
    //data: [],
    columns: [
      getTextToLocalMapping("Application No"), 
      getTextToLocalMapping("License No"),
      getTextToLocalMapping("Trade Name"),
      getTextToLocalMapping("Owner Name"),
      getTextToLocalMapping("Application Date"),
      getTextToLocalMapping("Status"),
      // {
      //   name: getTextToLocalMapping("Status"),
      //   options: {
      //     filter: false,
      //     customBodyRender: value => (

      //       <span
      //         style={
      //           value === "APPROVED" ? { color: "green" } : { color: "red" }
      //         }
      //       >
      //         {getTextToLocalMapping(value)}
      //       </span>
      //     )
      //   }
      // },
      {
        name: "tenantId",
        options: {
          display: false
        }
      }],
      title: getTextToLocalMapping("Search Results for Trade License Applications"),
    options: {
      filter: false,
      download: false,
      responsive: "stacked",
      selectableRows: false,
      hover: true,
      rowsPerPageOptions: [10, 15, 20],
      onRowClick: (row, index) => {
        onRowClick(row);
      }
    },
    customSortColumn: {
      column: "Application Date",
      sortingFn: (data, i, sortDateOrder) => {
        const epochDates = data.reduce((acc, curr) => {
          acc.push([...curr, getEpochForDate(curr[4], "dayend")]);
          return acc;
        }, []);
        const order = sortDateOrder === "asc" ? true : false;
        const finalData = sortByEpoch(epochDates, !order).map(item => {
          item.pop();
          return item;
        });
        return { data: finalData, currentOrder: !order ? "asc" : "desc" };
      }
    }
  }
};



const onRowClick = rowData => {
  console.log(rowData,"guru");
  switch (rowData[5]) {
    case "INITIATED":
      window.location.href = `apply?applicationNumber=${rowData[0]}&tenantId=${
        rowData[6]
      }`;
      break;
    default:
      window.location.href = `search-preview?applicationNumber=${
        rowData[0]
      }&tenantId=${rowData[6]}`;
      break;
  }
};




// const onRowClick = rowData => {
//   console.log(rowData,"rowData==========================================>")
//   switch (rowData[get(textToLocalMapping, "Status")]) {
//     case get(textToLocalMapping, "APPLIED"):
//     case get(textToLocalMapping, "PENDINGPAYMENT"):
//       return `/tradelicence/search-preview?status=pending_payment&role=approver&applicationNumber=${
//         rowData[get(textToLocalMapping, "Application No")]
//       }&tenantId=${rowData["tenantId"]}`;
//     case get(textToLocalMapping, "APPROVED"):
//       return `/tradelicence/search-preview?status=approved&role=approver&applicationNumber=${
//         rowData[get(textToLocalMapping, "Application No")]
//       }&tenantId=${rowData["tenantId"]}`;

//     case get(textToLocalMapping, "PAID"):
//     case get(textToLocalMapping, "PENDINGAPPROVAL"):
//     case get(textToLocalMapping, "FIELDINSPECTION"):
//       return `/tradelicence/search-preview?status=pending_approval&role=approver&applicationNumber=${
//         rowData[get(textToLocalMapping, "Application No")]
//       }&tenantId=${rowData["tenantId"]}`;
//     case get(textToLocalMapping, "CANCELLED"):
//       return `/tradelicence/search-preview?status=cancelled&role=approver&applicationNumber=${
//         rowData[get(textToLocalMapping, "Application No")]
//       }&tenantId=${rowData["tenantId"]}`;
//     case get(textToLocalMapping, "INITIATED"):
//       return `/tradelicence/apply?applicationNumber=${
//         rowData[get(textToLocalMapping, "Application No")]
//       }&tenantId=${rowData["tenantId"]}`;
//     case get(textToLocalMapping, "REJECTED"):
//       return `/tradelicence/search-preview?status=rejected&role=approver&applicationNumber=${
//         rowData[get(textToLocalMapping, "Application No")]
//       }&tenantId=${rowData["tenantId"]}`;
//     default:
//       return `/tradelicence/search`;
//   }
// };
