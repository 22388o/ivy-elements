// external imports
import React from "react"
import { connect } from "react-redux"
import ReactTooltip from "react-tooltip"

// ionio imports
import Section from "../../app/components/section"
import { Display } from "../../contracts/components/display"
import { ContractParameters } from "../../contracts/components/parameters"
import { Bytecode } from "./opcodes"

// internal imports
import {
  getCompiled,
  getContractParameters,
  getError,
  getInstantiated,
  getSource
} from "../selectors"
import Editor from "./editor"
import LockButton from "./lockButton"

const mapStateToProps = state => {
  const source = getSource(state)
  const contractParameters = getContractParameters(state)
  const error = getError(state)
  const bytecode = getInstantiated(state)
  return { source, contractParameters, error, bytecode }
}

const ErrorAlert = (props: { error: string }) => {
  return (
    <div
      style={{ margin: "25px 0 0 0" }}
      className="alert alert-danger"
      role="alert"
    >
      <span className="sr-only">Error:</span>
      <span
        className="glyphicon glyphicon-exclamation-sign"
        style={{ marginRight: "5px" }}
      />
      {props.error}
    </div>
  )
}

const Lock = ({ source, contractParameters, error, bytecode }) => {
  let instantiate
  if (contractParameters !== undefined) {
    instantiate = (
      <div>
        {contractParameters.length > 0 ? (
          <Section name="Contract Arguments">
            <div className="form-wrapper">
              <ContractParameters />
            </div>
            <div className="form-wrapper">
              {error ? <ErrorAlert error={error} /> : <div />}
            </div>
          </Section>
        ) : (
          <div />
        )}
        {bytecode ? (
          <Section name="Address">{error ? <div /> : <Bytecode />}</Section>
        ) : (
          <div />
        )}
        <LockButton />
      </div>
    )
  } else {
    instantiate = <div />
  }
  return (
    <div>
      <Editor />
      {instantiate}
    </div>
  )
}

export default connect(mapStateToProps)(Lock)
