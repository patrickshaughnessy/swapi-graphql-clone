/* */ 
(function(process) {
  'use strict';
  var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];
  var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];
  var GraphQLQueryRunner = require('./GraphQLQueryRunner');
  var GraphQLStoreChangeEmitter = require('./GraphQLStoreChangeEmitter');
  var GraphQLStoreDataHandler = require('./GraphQLStoreDataHandler');
  var GraphQLStoreRangeUtils = require('./GraphQLStoreRangeUtils');
  var RelayChangeTracker = require('./RelayChangeTracker');
  var RelayConnectionInterface = require('./RelayConnectionInterface');
  var RelayMutationQueue = require('./RelayMutationQueue');
  var RelayNodeInterface = require('./RelayNodeInterface');
  var RelayPendingQueryTracker = require('./RelayPendingQueryTracker');
  var RelayProfiler = require('./RelayProfiler');
  var RelayQuery = require('./RelayQuery');
  var RelayQueryTracker = require('./RelayQueryTracker');
  var RelayQueryWriter = require('./RelayQueryWriter');
  var RelayRecordStore = require('./RelayRecordStore');
  var RelayStoreGarbageCollector = require('./RelayStoreGarbageCollector');
  var forEachObject = require('fbjs/lib/forEachObject');
  var invariant = require('fbjs/lib/invariant');
  var generateForceIndex = require('./generateForceIndex');
  var readRelayDiskCache = require('./readRelayDiskCache');
  var warning = require('fbjs/lib/warning');
  var writeRelayQueryPayload = require('./writeRelayQueryPayload');
  var writeRelayUpdatePayload = require('./writeRelayUpdatePayload');
  var CLIENT_MUTATION_ID = RelayConnectionInterface.CLIENT_MUTATION_ID;
  var NODE_TYPE = RelayNodeInterface.NODE_TYPE;
  var _instance;
  var RelayStoreData = (function() {
    RelayStoreData.getDefaultInstance = function getDefaultInstance() {
      if (!_instance) {
        _instance = new RelayStoreData();
      }
      return _instance;
    };
    function RelayStoreData() {
      _classCallCheck(this, RelayStoreData);
      var cachedRecords = {};
      var cachedRootCallMap = {};
      var queuedRecords = {};
      var records = {};
      var rootCallMap = {};
      var nodeRangeMap = {};
      var _createRecordCollection = createRecordCollection({
        cachedRecords: cachedRecords,
        cachedRootCallMap: cachedRootCallMap,
        cacheWriter: null,
        queuedRecords: queuedRecords,
        nodeRangeMap: nodeRangeMap,
        records: records,
        rootCallMap: rootCallMap
      });
      var cachedStore = _createRecordCollection.cachedStore;
      var queuedStore = _createRecordCollection.queuedStore;
      var recordStore = _createRecordCollection.recordStore;
      var rangeData = new GraphQLStoreRangeUtils();
      this._cacheManager = null;
      this._cachedRecords = cachedRecords;
      this._cachedRootCallMap = cachedRootCallMap;
      this._cachedStore = cachedStore;
      this._changeEmitter = new GraphQLStoreChangeEmitter(rangeData);
      this._mutationQueue = new RelayMutationQueue(this);
      this._nodeRangeMap = nodeRangeMap;
      this._pendingQueryTracker = new RelayPendingQueryTracker(this);
      this._queryRunner = new GraphQLQueryRunner(this);
      this._queryTracker = new RelayQueryTracker();
      this._queuedRecords = queuedRecords;
      this._queuedStore = queuedStore;
      this._records = records;
      this._recordStore = recordStore;
      this._rangeData = rangeData;
      this._rootCallMap = rootCallMap;
    }
    RelayStoreData.prototype.initializeGarbageCollector = function initializeGarbageCollector() {
      !!this._garbageCollector ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayStoreData: Garbage collector is already initialized.') : invariant(false) : undefined;
      var shouldInitialize = this._isStoreDataEmpty();
      process.env.NODE_ENV !== 'production' ? warning(shouldInitialize, 'RelayStoreData: Garbage collection can only be initialized when no ' + 'data is present.') : undefined;
      if (shouldInitialize) {
        this._garbageCollector = new RelayStoreGarbageCollector(this);
      }
    };
    RelayStoreData.prototype.injectCacheManager = function injectCacheManager(cacheManager) {
      var _createRecordCollection2 = createRecordCollection({
        cachedRecords: this._cachedRecords,
        cachedRootCallMap: this._cachedRootCallMap,
        cacheWriter: cacheManager ? cacheManager.getQueryWriter() : null,
        queuedRecords: this._queuedRecords,
        nodeRangeMap: this._nodeRangeMap,
        records: this._records,
        rootCallMap: this._rootCallMap
      });
      var cachedStore = _createRecordCollection2.cachedStore;
      var queuedStore = _createRecordCollection2.queuedStore;
      var recordStore = _createRecordCollection2.recordStore;
      this._cacheManager = cacheManager;
      this._cachedStore = cachedStore;
      this._queuedStore = queuedStore;
      this._recordStore = recordStore;
    };
    RelayStoreData.prototype.clearCacheManager = function clearCacheManager() {
      var _createRecordCollection3 = createRecordCollection({
        cachedRecords: this._cachedRecords,
        cachedRootCallMap: this._cachedRootCallMap,
        cacheWriter: null,
        queuedRecords: this._queuedRecords,
        nodeRangeMap: this._nodeRangeMap,
        records: this._records,
        rootCallMap: this._rootCallMap
      });
      var cachedStore = _createRecordCollection3.cachedStore;
      var queuedStore = _createRecordCollection3.queuedStore;
      var recordStore = _createRecordCollection3.recordStore;
      this._cacheManager = null;
      this._cachedStore = cachedStore;
      this._queuedStore = queuedStore;
      this._recordStore = recordStore;
    };
    RelayStoreData.prototype.hasCacheManager = function hasCacheManager() {
      return !!this._cacheManager;
    };
    RelayStoreData.prototype.hasOptimisticUpdate = function hasOptimisticUpdate(dataID) {
      dataID = this.getRangeData().getCanonicalClientID(dataID);
      return this.getQueuedStore().hasOptimisticUpdate(dataID);
    };
    RelayStoreData.prototype.getClientMutationIDs = function getClientMutationIDs(dataID) {
      dataID = this.getRangeData().getCanonicalClientID(dataID);
      return this.getQueuedStore().getClientMutationIDs(dataID);
    };
    RelayStoreData.prototype.readFromDiskCache = function readFromDiskCache(queries, callbacks) {
      var cacheManager = this._cacheManager;
      !cacheManager ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayStoreData: `readFromDiskCache` should only be called when cache ' + 'manager is available.') : invariant(false) : undefined;
      var profile = RelayProfiler.profile('RelayStoreData.readFromDiskCache');
      readRelayDiskCache(queries, this._queuedStore, this._cachedRecords, this._cachedRootCallMap, cacheManager, {
        onSuccess: function onSuccess() {
          profile.stop();
          callbacks.onSuccess && callbacks.onSuccess();
        },
        onFailure: function onFailure() {
          profile.stop();
          callbacks.onFailure && callbacks.onFailure();
        }
      });
    };
    RelayStoreData.prototype.handleQueryPayload = function handleQueryPayload(query, response, forceIndex) {
      var profiler = RelayProfiler.profile('RelayStoreData.handleQueryPayload');
      var changeTracker = new RelayChangeTracker();
      var writer = new RelayQueryWriter(this._cachedStore, this._queryTracker, changeTracker, {
        forceIndex: forceIndex,
        updateTrackedQueries: true
      });
      writeRelayQueryPayload(writer, query, response);
      this._handleChangedAndNewDataIDs(changeTracker.getChangeSet());
      profiler.stop();
    };
    RelayStoreData.prototype.handleUpdatePayload = function handleUpdatePayload(operation, payload, _ref) {
      var configs = _ref.configs;
      var isOptimisticUpdate = _ref.isOptimisticUpdate;
      var profiler = RelayProfiler.profile('RelayStoreData.handleUpdatePayload');
      var changeTracker = new RelayChangeTracker();
      var store;
      if (isOptimisticUpdate) {
        var clientMutationID = payload[CLIENT_MUTATION_ID];
        !(typeof clientMutationID === 'string') ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayStoreData.handleUpdatePayload(): Expected optimistic payload ' + 'to have a valid `%s`.', CLIENT_MUTATION_ID) : invariant(false) : undefined;
        store = this.getRecordStoreForOptimisticMutation(clientMutationID);
      } else {
        store = this._getRecordStoreForMutation();
      }
      var writer = new RelayQueryWriter(store, this._queryTracker, changeTracker, {
        forceIndex: generateForceIndex(),
        isOptimisticUpdate: isOptimisticUpdate,
        updateTrackedQueries: false
      });
      writeRelayUpdatePayload(writer, operation, payload, {
        configs: configs,
        isOptimisticUpdate: isOptimisticUpdate
      });
      this._handleChangedAndNewDataIDs(changeTracker.getChangeSet());
      profiler.stop();
    };
    RelayStoreData.prototype.buildFragmentQueryForDataID = function buildFragmentQueryForDataID(fragment, dataID) {
      if (GraphQLStoreDataHandler.isClientID(dataID)) {
        var path = this._queuedStore.getPathToRecord(dataID);
        !path ? process.env.NODE_ENV !== 'production' ? invariant(false, 'RelayStoreData.buildFragmentQueryForDataID(): Cannot refetch ' + 'record `%s` without a path.', dataID) : invariant(false) : undefined;
        return path.getQuery(fragment);
      }
      return RelayQuery.Root.build(fragment.getDebugName() || 'UnknownQuery', RelayNodeInterface.NODE, dataID, [fragment], {identifyingArgName: RelayNodeInterface.ID}, NODE_TYPE);
    };
    RelayStoreData.prototype.getNodeData = function getNodeData() {
      return this._records;
    };
    RelayStoreData.prototype.getQueuedData = function getQueuedData() {
      return this._queuedRecords;
    };
    RelayStoreData.prototype.clearQueuedData = function clearQueuedData() {
      var _this = this;
      forEachObject(this._queuedRecords, function(_, key) {
        delete _this._queuedRecords[key];
        _this._changeEmitter.broadcastChangeForID(key);
      });
    };
    RelayStoreData.prototype.getCachedData = function getCachedData() {
      return this._cachedRecords;
    };
    RelayStoreData.prototype.getGarbageCollector = function getGarbageCollector() {
      return this._garbageCollector;
    };
    RelayStoreData.prototype.getMutationQueue = function getMutationQueue() {
      return this._mutationQueue;
    };
    RelayStoreData.prototype.getCachedStore = function getCachedStore() {
      return this._cachedStore;
    };
    RelayStoreData.prototype.getQueuedStore = function getQueuedStore() {
      return this._queuedStore;
    };
    RelayStoreData.prototype.getRecordStore = function getRecordStore() {
      return this._recordStore;
    };
    RelayStoreData.prototype.getQueryTracker = function getQueryTracker() {
      return this._queryTracker;
    };
    RelayStoreData.prototype.getQueryRunner = function getQueryRunner() {
      return this._queryRunner;
    };
    RelayStoreData.prototype.getChangeEmitter = function getChangeEmitter() {
      return this._changeEmitter;
    };
    RelayStoreData.prototype.getChangeEmitter = function getChangeEmitter() {
      return this._changeEmitter;
    };
    RelayStoreData.prototype.getRangeData = function getRangeData() {
      return this._rangeData;
    };
    RelayStoreData.prototype.getPendingQueryTracker = function getPendingQueryTracker() {
      return this._pendingQueryTracker;
    };
    RelayStoreData.prototype.getRootCallData = function getRootCallData() {
      return this._rootCallMap;
    };
    RelayStoreData.prototype._isStoreDataEmpty = function _isStoreDataEmpty() {
      return _Object$keys(this._records).length === 0 && _Object$keys(this._queuedRecords).length === 0 && _Object$keys(this._cachedRecords).length === 0;
    };
    RelayStoreData.prototype._handleChangedAndNewDataIDs = function _handleChangedAndNewDataIDs(changeSet) {
      var _this2 = this;
      var updatedDataIDs = _Object$keys(changeSet.updated);
      updatedDataIDs.forEach(function(id) {
        return _this2._changeEmitter.broadcastChangeForID(id);
      });
      if (this._garbageCollector) {
        var createdDataIDs = _Object$keys(changeSet.created);
        var garbageCollector = this._garbageCollector;
        createdDataIDs.forEach(function(dataID) {
          return garbageCollector.register(dataID);
        });
      }
    };
    RelayStoreData.prototype._getRecordStoreForMutation = function _getRecordStoreForMutation() {
      var records = this._records;
      var rootCallMap = this._rootCallMap;
      return new RelayRecordStore({records: records}, {rootCallMap: rootCallMap}, this._nodeRangeMap, this._cacheManager ? this._cacheManager.getMutationWriter() : null);
    };
    RelayStoreData.prototype.getRecordStoreForOptimisticMutation = function getRecordStoreForOptimisticMutation(clientMutationID) {
      var cachedRecords = this._cachedRecords;
      var cachedRootCallMap = this._cachedRootCallMap;
      var rootCallMap = this._rootCallMap;
      var queuedRecords = this._queuedRecords;
      var records = this._records;
      return new RelayRecordStore({
        cachedRecords: cachedRecords,
        queuedRecords: queuedRecords,
        records: records
      }, {
        cachedRootCallMap: cachedRootCallMap,
        rootCallMap: rootCallMap
      }, this._nodeRangeMap, null, clientMutationID);
    };
    return RelayStoreData;
  })();
  function createRecordCollection(_ref2) {
    var cachedRecords = _ref2.cachedRecords;
    var cachedRootCallMap = _ref2.cachedRootCallMap;
    var cacheWriter = _ref2.cacheWriter;
    var queuedRecords = _ref2.queuedRecords;
    var nodeRangeMap = _ref2.nodeRangeMap;
    var records = _ref2.records;
    var rootCallMap = _ref2.rootCallMap;
    return {
      queuedStore: new RelayRecordStore({
        cachedRecords: cachedRecords,
        queuedRecords: queuedRecords,
        records: records
      }, {
        cachedRootCallMap: cachedRootCallMap,
        rootCallMap: rootCallMap
      }, nodeRangeMap),
      cachedStore: new RelayRecordStore({
        cachedRecords: cachedRecords,
        records: records
      }, {
        cachedRootCallMap: cachedRootCallMap,
        rootCallMap: rootCallMap
      }, nodeRangeMap, cacheWriter),
      recordStore: new RelayRecordStore({records: records}, {rootCallMap: rootCallMap}, nodeRangeMap, cacheWriter)
    };
  }
  RelayProfiler.instrumentMethods(RelayStoreData.prototype, {
    handleQueryPayload: 'RelayStoreData.prototype.handleQueryPayload',
    handleUpdatePayload: 'RelayStoreData.prototype.handleUpdatePayload'
  });
  module.exports = RelayStoreData;
})(require('process'));
