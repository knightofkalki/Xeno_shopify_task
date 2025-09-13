"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "_ssr_utils_eventTracker_js";
exports.ids = ["_ssr_utils_eventTracker_js"];
exports.modules = {

/***/ "(ssr)/./utils/eventTracker.js":
/*!*******************************!*\
  !*** ./utils/eventTracker.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   EVENTS: () => (/* binding */ EVENTS),\n/* harmony export */   trackEvent: () => (/* binding */ trackEvent)\n/* harmony export */ });\nconst BACKEND_URL = 'http://localhost:3001';\nconst trackEvent = async (eventType, eventData, tenantId = '1')=>{\n    try {\n        await fetch(`${BACKEND_URL}/api/events/track`, {\n            method: 'POST',\n            headers: {\n                'Content-Type': 'application/json'\n            },\n            body: JSON.stringify({\n                tenantId,\n                eventType,\n                eventData,\n                userId: `user_${Date.now()}`,\n                sessionId: `session_${Date.now()}`\n            })\n        });\n    } catch (error) {\n        console.error('Event tracking failed:', error);\n    }\n};\n// Pre-defined event types\nconst EVENTS = {\n    CART_ABANDONMENT: 'cart_abandonment',\n    CHECKOUT_STARTED: 'checkout_started',\n    CHECKOUT_COMPLETED: 'checkout_completed',\n    PRODUCT_VIEWED: 'product_viewed',\n    PRODUCT_ADDED_TO_CART: 'product_added_to_cart'\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi91dGlscy9ldmVudFRyYWNrZXIuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxNQUFNQSxjQUFjO0FBRWIsTUFBTUMsYUFBYSxPQUFPQyxXQUFXQyxXQUFXQyxXQUFXLEdBQUc7SUFDbkUsSUFBSTtRQUNGLE1BQU1DLE1BQU0sR0FBR0wsWUFBWSxpQkFBaUIsQ0FBQyxFQUFFO1lBQzdDTSxRQUFRO1lBQ1JDLFNBQVM7Z0JBQUUsZ0JBQWdCO1lBQW1CO1lBQzlDQyxNQUFNQyxLQUFLQyxTQUFTLENBQUM7Z0JBQ25CTjtnQkFDQUY7Z0JBQ0FDO2dCQUNBUSxRQUFRLENBQUMsS0FBSyxFQUFFQyxLQUFLQyxHQUFHLElBQUk7Z0JBQzVCQyxXQUFXLENBQUMsUUFBUSxFQUFFRixLQUFLQyxHQUFHLElBQUk7WUFDcEM7UUFDRjtJQUNGLEVBQUUsT0FBT0UsT0FBTztRQUNkQyxRQUFRRCxLQUFLLENBQUMsMEJBQTBCQTtJQUMxQztBQUNGLEVBQUU7QUFFRiwwQkFBMEI7QUFDbkIsTUFBTUUsU0FBUztJQUNwQkMsa0JBQWtCO0lBQ2xCQyxrQkFBa0I7SUFDbEJDLG9CQUFvQjtJQUNwQkMsZ0JBQWdCO0lBQ2hCQyx1QkFBdUI7QUFDekIsRUFBRSIsInNvdXJjZXMiOlsiL1VzZXJzL3VqandhbGFnZ2Fyd2FsL3hlbm8tc2hvcGlmeS1zZXJ2aWNlL3hlbm8tc2hvcGlmeS1zZXJ2aWNlL3hlbm8tZGFzaGJvYXJkL3V0aWxzL2V2ZW50VHJhY2tlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBCQUNLRU5EX1VSTCA9ICdodHRwOi8vbG9jYWxob3N0OjMwMDEnO1xuXG5leHBvcnQgY29uc3QgdHJhY2tFdmVudCA9IGFzeW5jIChldmVudFR5cGUsIGV2ZW50RGF0YSwgdGVuYW50SWQgPSAnMScpID0+IHtcbiAgdHJ5IHtcbiAgICBhd2FpdCBmZXRjaChgJHtCQUNLRU5EX1VSTH0vYXBpL2V2ZW50cy90cmFja2AsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIHRlbmFudElkLFxuICAgICAgICBldmVudFR5cGUsXG4gICAgICAgIGV2ZW50RGF0YSxcbiAgICAgICAgdXNlcklkOiBgdXNlcl8ke0RhdGUubm93KCl9YCxcbiAgICAgICAgc2Vzc2lvbklkOiBgc2Vzc2lvbl8ke0RhdGUubm93KCl9YFxuICAgICAgfSlcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFdmVudCB0cmFja2luZyBmYWlsZWQ6JywgZXJyb3IpO1xuICB9XG59O1xuXG4vLyBQcmUtZGVmaW5lZCBldmVudCB0eXBlc1xuZXhwb3J0IGNvbnN0IEVWRU5UUyA9IHtcbiAgQ0FSVF9BQkFORE9OTUVOVDogJ2NhcnRfYWJhbmRvbm1lbnQnLFxuICBDSEVDS09VVF9TVEFSVEVEOiAnY2hlY2tvdXRfc3RhcnRlZCcsXG4gIENIRUNLT1VUX0NPTVBMRVRFRDogJ2NoZWNrb3V0X2NvbXBsZXRlZCcsXG4gIFBST0RVQ1RfVklFV0VEOiAncHJvZHVjdF92aWV3ZWQnLFxuICBQUk9EVUNUX0FEREVEX1RPX0NBUlQ6ICdwcm9kdWN0X2FkZGVkX3RvX2NhcnQnXG59O1xuIl0sIm5hbWVzIjpbIkJBQ0tFTkRfVVJMIiwidHJhY2tFdmVudCIsImV2ZW50VHlwZSIsImV2ZW50RGF0YSIsInRlbmFudElkIiwiZmV0Y2giLCJtZXRob2QiLCJoZWFkZXJzIiwiYm9keSIsIkpTT04iLCJzdHJpbmdpZnkiLCJ1c2VySWQiLCJEYXRlIiwibm93Iiwic2Vzc2lvbklkIiwiZXJyb3IiLCJjb25zb2xlIiwiRVZFTlRTIiwiQ0FSVF9BQkFORE9OTUVOVCIsIkNIRUNLT1VUX1NUQVJURUQiLCJDSEVDS09VVF9DT01QTEVURUQiLCJQUk9EVUNUX1ZJRVdFRCIsIlBST0RVQ1RfQURERURfVE9fQ0FSVCJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/./utils/eventTracker.js\n");

/***/ })

};
;