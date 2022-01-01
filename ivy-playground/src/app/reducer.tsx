// external imports
import { routerReducer } from "react-router-redux"
import { combineReducers } from "redux"

// ionio imports
import contracts from "../contracts"
import templates from "../templates"

// internal imports
import * as actions from "./actions"
import * as types from "./types"

export default function reducer(state: types.AppState, action): types.AppState {
  switch (action.type) {
    case actions.RESET:
      return {
        contracts: contracts.reducer(undefined, {}),
        templates: templates.reducer(undefined, {}),
        routing: state.routing
      }
    default:
      return combineReducers({
        contracts: contracts.reducer,
        templates: templates.reducer,
        routing: routerReducer
      })(state, action) as types.AppState
  }
}
