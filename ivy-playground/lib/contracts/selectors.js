// external imports
import { createSelector } from "reselect";
import { addParameterInput, getData, getPrivateKeyValue, getSequence } from "../inputs/data";
import { static as Immutable } from "seamless-immutable";
import { getAppState } from "../app/selectors";
import { createSignature, fulfill, spend, toSighash } from "ivy-bitcoin";
export const getState = createSelector(getAppState, (state) => state.contracts);
export const getContractIds = createSelector(getState, (state) => state.idList);
export const getSpentContractIds = createSelector(getState, (state) => state.spentIdList);
export const getContractMap = createSelector(getState, (state) => state.contractMap);
export const getContract = (state, contractId) => {
    const contractMap = getContractMap(state);
    return contractMap[contractId];
};
export const getSpendContractId = createSelector(getState, (state) => state.spendContractId);
export const getSelectedClauseIndex = createSelector(getState, (state) => {
    const selectedClauseIndex = state.selectedClauseIndex;
    if (typeof selectedClauseIndex === "number") {
        return selectedClauseIndex;
    }
    else {
        return parseInt(selectedClauseIndex, 10);
    }
});
export const getShowUnlockInputErrors = createSelector(getState, (state) => state.showUnlockInputErrors);
export const getSpendContract = createSelector(getContractMap, getSpendContractId, (contractMap, contractId) => {
    const spendContract = contractMap[contractId];
    if (spendContract === undefined) {
        throw new Error("no contract for ID " + contractId);
    }
    return spendContract;
});
export const getSpendContractJson = createSelector(getSpendContract, (contract) => {
    return JSON.stringify(contract.instantiated);
});
export const getInputSelector = (id) => {
    return createSelector(getInputMap, (inputMap) => {
        const input = inputMap[id];
        if (input === undefined) {
            throw new Error("bad input ID: " + id);
        }
        else {
            return input;
        }
    });
};
export const getSpendInputSelector = (id) => {
    return createSelector(getSpendInputMap, (spendInputMap) => {
        const spendInput = spendInputMap[id];
        if (spendInput === undefined) {
            throw new Error("bad spend input ID: " + id);
        }
        else {
            return spendInput;
        }
    });
};
export const getSpendInputMap = createSelector(getSpendContract, spendContract => spendContract.spendInputMap);
export const getInputMap = createSelector(getSpendContract, spendContract => spendContract.inputMap);
export const getParameterIds = createSelector(getSpendContract, spendContract => spendContract.instantiated.template.params.map(param => "contractParameters." + param.name));
export const getSelectedClause = createSelector(getSpendContract, getSelectedClauseIndex, (spendContract, clauseIndex) => {
    return spendContract.instantiated.template.clauses[clauseIndex];
});
export const getClauseName = createSelector(getSelectedClause, clause => clause.name);
export const getClauseParameters = createSelector(getSelectedClause, clause => clause.parameters);
export const getClauseParameterIds = createSelector(getClauseName, getClauseParameters, (clauseName, clauseParameters) => {
    return clauseParameters.map(param => "clauseParameters." + clauseName + "." + param.name);
});
export const getInstantiated = createSelector(getSpendContract, contract => contract.instantiated);
export const getSpendSourceTransaction = createSelector(getSpendContract, spendContract => spendContract.instantiated.fundingTransaction);
export const getSpendDestinationAddress = createSelector(getSpendContract, spendContract => {
    return spendContract.withdrawAddress;
});
export const getSpendingLocktime = createSelector(getSpendInputMap, spendInputMap => {
    try {
        return getData("transactionDetails.lockTimeInput", spendInputMap);
    }
    catch (e) {
        console.log(e);
        return undefined;
    }
});
export const getSpendingSequenceNumber = createSelector(getSpendInputMap, spendInputMap => {
    try {
        const sequenceNumber = getSequence(spendInputMap);
        return sequenceNumber;
    }
    catch (e) {
        console.log(e);
        return undefined;
    }
});
export const getSpendAmountInSatoshis = createSelector(getSpendContract, spendContract => spendContract.instantiated.amount);
export const getSpendTransaction = createSelector(getSpendSourceTransaction, getSpendDestinationAddress, getSpendAmountInSatoshis, getSpendingLocktime, getSpendingSequenceNumber, (spendSourceTransaction, spendDestinationAddress, amount, locktime, sequenceNumber) => {
    if (locktime === undefined ||
        sequenceNumber === undefined ||
        spendSourceTransaction === undefined) {
        return undefined;
    }
    return Immutable.asMutable(spend(spendSourceTransaction, spendDestinationAddress, amount, locktime, sequenceNumber), { deep: true });
});
export const getSpendTransactionSigHash = createSelector(getInstantiated, getSpendTransaction, (instantiated, spendTransaction) => toSighash(instantiated, spendTransaction));
export const getNumberOfClauses = createSelector(getSpendContract, spendContract => spendContract.instantiated.template.clauses.length);
export const getSpendClauseArgument = createSelector(getSelectedClause, selectedClause => {
    return selectedClause.name;
});
export const getSpendInputValues = createSelector(getClauseParameterIds, getSpendInputMap, getSpendTransactionSigHash, (clauseParameterIds, spendInputMap, sigHash) => {
    try {
        const spendInputValues = Immutable.asMutable(clauseParameterIds, {
            deep: true
        }).map(id => getData(id, spendInputMap, sigHash));
        if (!spendInputValues.every(el => el !== undefined)) {
            return undefined;
        }
        return spendInputValues;
    }
    catch (e) {
        // console.log(e)
        return undefined;
    }
});
export const getSignatureData = (state, id, inputsById) => {
    const sigHash = getSpendTransactionSigHash(state);
    if (sigHash === undefined) {
        return undefined;
    }
    const secret = getPrivateKeyValue(id, inputsById);
    const sig = createSignature(sigHash, secret);
    return sig ? sig.toString("hex") : undefined;
};
export const getRedeemScript = createSelector(getSpendContract, spendContract => spendContract.instantiated.redeemScript);
export const getWitnessScript = createSelector(getSpendContract, spendContract => spendContract.instantiated.witnessScript);
export const getScriptSig = createSelector(getSpendContract, spendContract => spendContract.instantiated.scriptSig);
export const getFulfilledSpendTransaction = createSelector(getInstantiated, getSpendTransaction, getSpendInputValues, getSpendClauseArgument, (instantiated, unfulfilledSpendTransaction, witnessArgs, spendClauseArgument) => {
    if (instantiated === undefined ||
        unfulfilledSpendTransaction === undefined ||
        witnessArgs === undefined) {
        return undefined;
    }
    const spendTransaction = fulfill(instantiated, unfulfilledSpendTransaction, Immutable.asMutable(witnessArgs, { deep: true }), spendClauseArgument);
    return spendTransaction;
});
export function getSpendInput(state, id) {
    const spendInputsById = getSpendInputMap(state);
    const spendInput = spendInputsById[id];
    if (spendInput === undefined) {
        throw new Error("bad spend input ID: " + id);
    }
    else {
        return spendInput;
    }
}
export const getResult = createSelector(getSpendInputValues, getFulfilledSpendTransaction, getSpendingLocktime, getSpendingSequenceNumber, (spendInputValues, tx, lockTime, sequenceNumber) => {
    if (spendInputValues === undefined ||
        lockTime === undefined ||
        sequenceNumber === undefined) {
        return {
            success: false,
            style: "warning",
            message: "The provided inputs are invalid."
        };
    }
    if (tx === undefined) {
        return {
            success: false,
            style: "warning",
            message: "The spending transaction is invalid."
        };
    }
    const enabled = false;
    try {
        tx.check();
    }
    catch (e) {
        console.log(e);
        return {
            success: false,
            style: "danger",
            message: "The provided inputs do not satisfy the contract (" + e.code + ")."
        };
    }
    return { success: true };
});
export const areSpendInputsValid = createSelector(getSpendInputMap, getClauseParameterIds, getSpendTransactionSigHash, (spendInputMap, parameterIds, sigHash) => {
    try {
        parameterIds.filter(id => {
            getData(id, spendInputMap, sigHash);
        });
        return true;
    }
    catch (e) {
        // console.log(e)
        return false;
    }
});
export const getSpendContractClauses = createSelector(getSpendContract, contract => contract.instantiated.template.clauses);
export const getSpendContractTemplate = createSelector(getSpendContract, contract => contract.instantiated.template);
export const getSpendContractSource = createSelector(getSpendContractTemplate, template => template.source);
export const getSpendContractInstructions = createSelector(getSpendContractTemplate, template => template.instructions.join(" "));
export const getError = createSelector(getState, state => state.error);
export const getLockError = createSelector(getState, state => state.lockError);
export const generateInputMap = (compiled) => {
    const inputs = [];
    for (const param of compiled.params) {
        addParameterInput(inputs, param.valueType, "contractParameters." + param.name);
    }
    const inputMap = {};
    for (const input of inputs) {
        inputMap[input.name] = input;
    }
    return inputMap;
};
