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
exports.Notification = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const SimulationInstance_1 = require("./SimulationInstance");
/**
 * Notificaciones del sistema
 * Alertan a profesores, ministerio, etc. sobre eventos importantes
 */
let Notification = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('notifications'), (0, typeorm_1.Index)(['recipient_id']), (0, typeorm_1.Index)(['type']), (0, typeorm_1.Index)(['is_read']), (0, typeorm_1.Index)(['created_at'])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _recipient_id_decorators;
    let _recipient_id_initializers = [];
    let _recipient_id_extraInitializers = [];
    let _actor_id_decorators;
    let _actor_id_initializers = [];
    let _actor_id_extraInitializers = [];
    let _simulation_instance_id_decorators;
    let _simulation_instance_id_initializers = [];
    let _simulation_instance_id_extraInitializers = [];
    let _type_decorators;
    let _type_initializers = [];
    let _type_extraInitializers = [];
    let _title_decorators;
    let _title_initializers = [];
    let _title_extraInitializers = [];
    let _content_decorators;
    let _content_initializers = [];
    let _content_extraInitializers = [];
    let _metadata_decorators;
    let _metadata_initializers = [];
    let _metadata_extraInitializers = [];
    let _is_read_decorators;
    let _is_read_initializers = [];
    let _is_read_extraInitializers = [];
    let _read_at_decorators;
    let _read_at_initializers = [];
    let _read_at_extraInitializers = [];
    let _is_sent_decorators;
    let _is_sent_initializers = [];
    let _is_sent_extraInitializers = [];
    let _created_at_decorators;
    let _created_at_initializers = [];
    let _created_at_extraInitializers = [];
    let _recipient_decorators;
    let _recipient_initializers = [];
    let _recipient_extraInitializers = [];
    let _actor_decorators;
    let _actor_initializers = [];
    let _actor_extraInitializers = [];
    let _simulation_instance_decorators;
    let _simulation_instance_initializers = [];
    let _simulation_instance_extraInitializers = [];
    var Notification = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.recipient_id = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _recipient_id_initializers, void 0)); // A quién va la notificación
            this.actor_id = (__runInitializers(this, _recipient_id_extraInitializers), __runInitializers(this, _actor_id_initializers, void 0)); // Quién provocó la notificación
            this.simulation_instance_id = (__runInitializers(this, _actor_id_extraInitializers), __runInitializers(this, _simulation_instance_id_initializers, void 0)); // Simulación relacionada
            this.type = (__runInitializers(this, _simulation_instance_id_extraInitializers), __runInitializers(this, _type_initializers, void 0));
            this.title = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _title_initializers, void 0));
            this.content = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _content_initializers, void 0));
            this.metadata = (__runInitializers(this, _content_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
            // Seguimiento
            this.is_read = (__runInitializers(this, _metadata_extraInitializers), __runInitializers(this, _is_read_initializers, void 0));
            this.read_at = (__runInitializers(this, _is_read_extraInitializers), __runInitializers(this, _read_at_initializers, void 0));
            this.is_sent = (__runInitializers(this, _read_at_extraInitializers), __runInitializers(this, _is_sent_initializers, void 0)); // ¿Se envió por email?
            this.created_at = (__runInitializers(this, _is_sent_extraInitializers), __runInitializers(this, _created_at_initializers, void 0));
            // Relations
            this.recipient = (__runInitializers(this, _created_at_extraInitializers), __runInitializers(this, _recipient_initializers, void 0));
            this.actor = (__runInitializers(this, _recipient_extraInitializers), __runInitializers(this, _actor_initializers, void 0));
            this.simulation_instance = (__runInitializers(this, _actor_extraInitializers), __runInitializers(this, _simulation_instance_initializers, void 0));
            __runInitializers(this, _simulation_instance_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "Notification");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _recipient_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid' })];
        _actor_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid', nullable: true })];
        _simulation_instance_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid', nullable: true })];
        _type_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 50 })];
        _title_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _content_decorators = [(0, typeorm_1.Column)({ type: 'text' })];
        _metadata_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _is_read_decorators = [(0, typeorm_1.Column)({ type: 'boolean', default: false })];
        _read_at_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _is_sent_decorators = [(0, typeorm_1.Column)({ type: 'boolean', default: false })];
        _created_at_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _recipient_decorators = [(0, typeorm_1.ManyToOne)(() => User_1.User, user => user.notifications_received, { onDelete: 'CASCADE' }), (0, typeorm_1.JoinColumn)({ name: 'recipient_id' })];
        _actor_decorators = [(0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: 'SET NULL', nullable: true }), (0, typeorm_1.JoinColumn)({ name: 'actor_id' })];
        _simulation_instance_decorators = [(0, typeorm_1.ManyToOne)(() => SimulationInstance_1.SimulationInstance, { onDelete: 'SET NULL', nullable: true }), (0, typeorm_1.JoinColumn)({ name: 'simulation_instance_id' })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _recipient_id_decorators, { kind: "field", name: "recipient_id", static: false, private: false, access: { has: obj => "recipient_id" in obj, get: obj => obj.recipient_id, set: (obj, value) => { obj.recipient_id = value; } }, metadata: _metadata }, _recipient_id_initializers, _recipient_id_extraInitializers);
        __esDecorate(null, null, _actor_id_decorators, { kind: "field", name: "actor_id", static: false, private: false, access: { has: obj => "actor_id" in obj, get: obj => obj.actor_id, set: (obj, value) => { obj.actor_id = value; } }, metadata: _metadata }, _actor_id_initializers, _actor_id_extraInitializers);
        __esDecorate(null, null, _simulation_instance_id_decorators, { kind: "field", name: "simulation_instance_id", static: false, private: false, access: { has: obj => "simulation_instance_id" in obj, get: obj => obj.simulation_instance_id, set: (obj, value) => { obj.simulation_instance_id = value; } }, metadata: _metadata }, _simulation_instance_id_initializers, _simulation_instance_id_extraInitializers);
        __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
        __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: obj => "title" in obj, get: obj => obj.title, set: (obj, value) => { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
        __esDecorate(null, null, _content_decorators, { kind: "field", name: "content", static: false, private: false, access: { has: obj => "content" in obj, get: obj => obj.content, set: (obj, value) => { obj.content = value; } }, metadata: _metadata }, _content_initializers, _content_extraInitializers);
        __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: obj => "metadata" in obj, get: obj => obj.metadata, set: (obj, value) => { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
        __esDecorate(null, null, _is_read_decorators, { kind: "field", name: "is_read", static: false, private: false, access: { has: obj => "is_read" in obj, get: obj => obj.is_read, set: (obj, value) => { obj.is_read = value; } }, metadata: _metadata }, _is_read_initializers, _is_read_extraInitializers);
        __esDecorate(null, null, _read_at_decorators, { kind: "field", name: "read_at", static: false, private: false, access: { has: obj => "read_at" in obj, get: obj => obj.read_at, set: (obj, value) => { obj.read_at = value; } }, metadata: _metadata }, _read_at_initializers, _read_at_extraInitializers);
        __esDecorate(null, null, _is_sent_decorators, { kind: "field", name: "is_sent", static: false, private: false, access: { has: obj => "is_sent" in obj, get: obj => obj.is_sent, set: (obj, value) => { obj.is_sent = value; } }, metadata: _metadata }, _is_sent_initializers, _is_sent_extraInitializers);
        __esDecorate(null, null, _created_at_decorators, { kind: "field", name: "created_at", static: false, private: false, access: { has: obj => "created_at" in obj, get: obj => obj.created_at, set: (obj, value) => { obj.created_at = value; } }, metadata: _metadata }, _created_at_initializers, _created_at_extraInitializers);
        __esDecorate(null, null, _recipient_decorators, { kind: "field", name: "recipient", static: false, private: false, access: { has: obj => "recipient" in obj, get: obj => obj.recipient, set: (obj, value) => { obj.recipient = value; } }, metadata: _metadata }, _recipient_initializers, _recipient_extraInitializers);
        __esDecorate(null, null, _actor_decorators, { kind: "field", name: "actor", static: false, private: false, access: { has: obj => "actor" in obj, get: obj => obj.actor, set: (obj, value) => { obj.actor = value; } }, metadata: _metadata }, _actor_initializers, _actor_extraInitializers);
        __esDecorate(null, null, _simulation_instance_decorators, { kind: "field", name: "simulation_instance", static: false, private: false, access: { has: obj => "simulation_instance" in obj, get: obj => obj.simulation_instance, set: (obj, value) => { obj.simulation_instance = value; } }, metadata: _metadata }, _simulation_instance_initializers, _simulation_instance_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Notification = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Notification = _classThis;
})();
exports.Notification = Notification;
