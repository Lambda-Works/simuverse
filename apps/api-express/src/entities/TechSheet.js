"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TechSheet = void 0;
const typeorm_1 = require("typeorm");
/**
 * Fichas Técnicas del Ministerio de Educación
 * Equivalente al tech_sheets de la BD
 * Contiene los KPIs y competencias exigidos por el ministerio por curso
 */
let TechSheet = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('tech_sheets')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _course_id_decorators;
    let _course_id_initializers = [];
    let _course_id_extraInitializers = [];
    let _ministry_code_decorators;
    let _ministry_code_initializers = [];
    let _ministry_code_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _competencies_decorators;
    let _competencies_initializers = [];
    let _competencies_extraInitializers = [];
    let _kpi_requirements_decorators;
    let _kpi_requirements_initializers = [];
    let _kpi_requirements_extraInitializers = [];
    let _context_scenario_decorators;
    let _context_scenario_initializers = [];
    let _context_scenario_extraInitializers = [];
    let _extracted_data_decorators;
    let _extracted_data_initializers = [];
    let _extracted_data_extraInitializers = [];
    let _file_url_decorators;
    let _file_url_initializers = [];
    let _file_url_extraInitializers = [];
    let _processed_decorators;
    let _processed_initializers = [];
    let _processed_extraInitializers = [];
    let _processed_at_decorators;
    let _processed_at_initializers = [];
    let _processed_at_extraInitializers = [];
    let _uploaded_by_decorators;
    let _uploaded_by_initializers = [];
    let _uploaded_by_extraInitializers = [];
    let _created_at_decorators;
    let _created_at_initializers = [];
    let _created_at_extraInitializers = [];
    var TechSheet = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.name = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _name_initializers, void 0));
            this.course_id = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _course_id_initializers, void 0));
            this.ministry_code = (__runInitializers(this, _course_id_extraInitializers), __runInitializers(this, _ministry_code_initializers, void 0));
            this.description = (__runInitializers(this, _ministry_code_extraInitializers), __runInitializers(this, _description_initializers, void 0));
            this.competencies = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _competencies_initializers, void 0));
            this.kpi_requirements = (__runInitializers(this, _competencies_extraInitializers), __runInitializers(this, _kpi_requirements_initializers, void 0));
            this.context_scenario = (__runInitializers(this, _kpi_requirements_extraInitializers), __runInitializers(this, _context_scenario_initializers, void 0));
            this.extracted_data = (__runInitializers(this, _context_scenario_extraInitializers), __runInitializers(this, _extracted_data_initializers, void 0));
            this.file_url = (__runInitializers(this, _extracted_data_extraInitializers), __runInitializers(this, _file_url_initializers, void 0));
            this.processed = (__runInitializers(this, _file_url_extraInitializers), __runInitializers(this, _processed_initializers, void 0));
            this.processed_at = (__runInitializers(this, _processed_extraInitializers), __runInitializers(this, _processed_at_initializers, void 0));
            this.uploaded_by = (__runInitializers(this, _processed_at_extraInitializers), __runInitializers(this, _uploaded_by_initializers, void 0));
            this.created_at = (__runInitializers(this, _uploaded_by_extraInitializers), __runInitializers(this, _created_at_initializers, void 0));
            __runInitializers(this, _created_at_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "TechSheet");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)()];
        _name_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 200 })];
        _course_id_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: false })];
        _ministry_code_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true })];
        _description_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _competencies_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _kpi_requirements_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _context_scenario_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _extracted_data_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _file_url_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _processed_decorators = [(0, typeorm_1.Column)({ type: 'boolean', default: false })];
        _processed_at_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _uploaded_by_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true })];
        _created_at_decorators = [(0, typeorm_1.CreateDateColumn)()];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
        __esDecorate(null, null, _course_id_decorators, { kind: "field", name: "course_id", static: false, private: false, access: { has: obj => "course_id" in obj, get: obj => obj.course_id, set: (obj, value) => { obj.course_id = value; } }, metadata: _metadata }, _course_id_initializers, _course_id_extraInitializers);
        __esDecorate(null, null, _ministry_code_decorators, { kind: "field", name: "ministry_code", static: false, private: false, access: { has: obj => "ministry_code" in obj, get: obj => obj.ministry_code, set: (obj, value) => { obj.ministry_code = value; } }, metadata: _metadata }, _ministry_code_initializers, _ministry_code_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _competencies_decorators, { kind: "field", name: "competencies", static: false, private: false, access: { has: obj => "competencies" in obj, get: obj => obj.competencies, set: (obj, value) => { obj.competencies = value; } }, metadata: _metadata }, _competencies_initializers, _competencies_extraInitializers);
        __esDecorate(null, null, _kpi_requirements_decorators, { kind: "field", name: "kpi_requirements", static: false, private: false, access: { has: obj => "kpi_requirements" in obj, get: obj => obj.kpi_requirements, set: (obj, value) => { obj.kpi_requirements = value; } }, metadata: _metadata }, _kpi_requirements_initializers, _kpi_requirements_extraInitializers);
        __esDecorate(null, null, _context_scenario_decorators, { kind: "field", name: "context_scenario", static: false, private: false, access: { has: obj => "context_scenario" in obj, get: obj => obj.context_scenario, set: (obj, value) => { obj.context_scenario = value; } }, metadata: _metadata }, _context_scenario_initializers, _context_scenario_extraInitializers);
        __esDecorate(null, null, _extracted_data_decorators, { kind: "field", name: "extracted_data", static: false, private: false, access: { has: obj => "extracted_data" in obj, get: obj => obj.extracted_data, set: (obj, value) => { obj.extracted_data = value; } }, metadata: _metadata }, _extracted_data_initializers, _extracted_data_extraInitializers);
        __esDecorate(null, null, _file_url_decorators, { kind: "field", name: "file_url", static: false, private: false, access: { has: obj => "file_url" in obj, get: obj => obj.file_url, set: (obj, value) => { obj.file_url = value; } }, metadata: _metadata }, _file_url_initializers, _file_url_extraInitializers);
        __esDecorate(null, null, _processed_decorators, { kind: "field", name: "processed", static: false, private: false, access: { has: obj => "processed" in obj, get: obj => obj.processed, set: (obj, value) => { obj.processed = value; } }, metadata: _metadata }, _processed_initializers, _processed_extraInitializers);
        __esDecorate(null, null, _processed_at_decorators, { kind: "field", name: "processed_at", static: false, private: false, access: { has: obj => "processed_at" in obj, get: obj => obj.processed_at, set: (obj, value) => { obj.processed_at = value; } }, metadata: _metadata }, _processed_at_initializers, _processed_at_extraInitializers);
        __esDecorate(null, null, _uploaded_by_decorators, { kind: "field", name: "uploaded_by", static: false, private: false, access: { has: obj => "uploaded_by" in obj, get: obj => obj.uploaded_by, set: (obj, value) => { obj.uploaded_by = value; } }, metadata: _metadata }, _uploaded_by_initializers, _uploaded_by_extraInitializers);
        __esDecorate(null, null, _created_at_decorators, { kind: "field", name: "created_at", static: false, private: false, access: { has: obj => "created_at" in obj, get: obj => obj.created_at, set: (obj, value) => { obj.created_at = value; } }, metadata: _metadata }, _created_at_initializers, _created_at_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TechSheet = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TechSheet = _classThis;
})();
exports.TechSheet = TechSheet;
