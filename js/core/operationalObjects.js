const OPERATIONAL_OBJECT_REGISTRY = Object.freeze({
  brew_execution_record: Object.freeze({
    key: 'brew_execution_record',
    label: 'Brew Execution Record',
    owningDomainKey: 'brew_execution_domain',
    description: 'Primary operational execution record for active brew runs and step-level completion capture.',
    closureRelevant: true,
    dispatchRelevant: true,
    knowledgePromotable: true,
    fileSupported: true,
    intendedFutureStorageLayer: 'airtable',
    implementationStatus: 'planned',
  }),
  batch_closure_record: Object.freeze({
    key: 'batch_closure_record',
    label: 'Batch Closure Record',
    owningDomainKey: 'brew_execution_domain',
    description: 'Formal closure artifact for a completed batch, including final checks and closeout confirmation.',
    closureRelevant: true,
    dispatchRelevant: true,
    knowledgePromotable: true,
    fileSupported: true,
    intendedFutureStorageLayer: 'airtable',
    implementationStatus: 'planned',
  }),
  inventory_movement_record: Object.freeze({
    key: 'inventory_movement_record',
    label: 'Inventory Movement Record',
    owningDomainKey: 'production_planning_domain',
    description: 'Movement-level inventory event record for stock consumption, transfer, and availability tracking.',
    closureRelevant: false,
    dispatchRelevant: true,
    knowledgePromotable: false,
    fileSupported: true,
    intendedFutureStorageLayer: 'airtable',
    implementationStatus: 'planned',
  }),
  compliance_record: Object.freeze({
    key: 'compliance_record',
    label: 'Compliance Record',
    owningDomainKey: 'compliance_traceability_domain',
    description: 'Traceability and compliance evidence record supporting auditability and regulatory validation.',
    closureRelevant: true,
    dispatchRelevant: true,
    knowledgePromotable: true,
    fileSupported: true,
    intendedFutureStorageLayer: 'airtable',
    implementationStatus: 'planned',
  }),
  costing_input_record: Object.freeze({
    key: 'costing_input_record',
    label: 'Costing Input Record',
    owningDomainKey: 'costing_business_domain',
    description: 'Cost input reference record used for profitability, margin, and batch economics calculations.',
    closureRelevant: false,
    dispatchRelevant: true,
    knowledgePromotable: true,
    fileSupported: true,
    intendedFutureStorageLayer: 'airtable',
    implementationStatus: 'planned',
  }),
  supplier_reference_record: Object.freeze({
    key: 'supplier_reference_record',
    label: 'Supplier Reference Record',
    owningDomainKey: 'purchasing_supplier_domain',
    description: 'Supplier-level reference record for purchasing relationships, lead times, and sourcing context.',
    closureRelevant: false,
    dispatchRelevant: true,
    knowledgePromotable: false,
    fileSupported: true,
    intendedFutureStorageLayer: 'airtable',
    implementationStatus: 'planned',
  }),
  owner_communication_record: Object.freeze({
    key: 'owner_communication_record',
    label: 'Owner Communication Record',
    owningDomainKey: 'admin_hr_ownercomms_domain',
    description: 'Operational owner communication record for decision visibility, escalations, and accountability trails.',
    closureRelevant: false,
    dispatchRelevant: true,
    knowledgePromotable: true,
    fileSupported: true,
    intendedFutureStorageLayer: 'airtable',
    implementationStatus: 'planned',
  }),
  worked_hours_record: Object.freeze({
    key: 'worked_hours_record',
    label: 'Worked Hours Record',
    owningDomainKey: 'hours_worked_domain',
    description: 'Time capture record for hours worked to support labor visibility, payroll readiness, and costing inputs.',
    closureRelevant: false,
    dispatchRelevant: true,
    knowledgePromotable: false,
    fileSupported: true,
    intendedFutureStorageLayer: 'airtable',
    implementationStatus: 'planned',
  }),
});

const OPERATIONAL_OBJECT_KEYS = Object.freeze(Object.keys(OPERATIONAL_OBJECT_REGISTRY));

function getOperationalObjectDefinition(objectKey) {
  return OPERATIONAL_OBJECT_REGISTRY[objectKey] || null;
}

function listOperationalObjectDefinitions() {
  return OPERATIONAL_OBJECT_KEYS.map((objectKey) => OPERATIONAL_OBJECT_REGISTRY[objectKey]);
}

window.OPERATIONAL_OBJECT_REGISTRY = OPERATIONAL_OBJECT_REGISTRY;
window.OPERATIONAL_OBJECT_KEYS = OPERATIONAL_OBJECT_KEYS;
window.getOperationalObjectDefinition = getOperationalObjectDefinition;
window.listOperationalObjectDefinitions = listOperationalObjectDefinitions;
