"use strict";

const DbMixin = require("../mixins/db.mixin");
const axios = require("axios");

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
	name: "webhooks",
	// version: 1

	/**
	 * Mixins
	 */
	mixins: [DbMixin("webhooks")],

	/**
	 * Settings
	 */
	settings: {
		// Available fields in the responses
		fields: [
			"_id",
			"target"
		],

		// Validator for the `create` & `insert` actions.
		entityValidator: {
			target: "string",
		}
	},

	/**
	 * Action Hooks
	 */
	hooks: {
		before: {
			/**
			 * Register a before hook for the `create` action.
			 * It sets a default value for the quantity field.
			 *
			 * @param {Context} ctx
			 */
			create(ctx) {
				ctx.params.target = "";
			}
		}
	},

	/**
	 * Actions
	 */
	actions: {
		/**
		 * add the targetUrl in the database.
		 *
		 * @param {String} targetURL - the URL to which the webhook be sent out
		 * 
		 * @returns generated unique ID
		 */
		register: {
			rest: "POST /register",
			params: {
				targetURL: "string"
			},
			async handler(ctx) {
				const doc = await this.adapter.insert({ target: ctx.params.targetURL });
				const json = await this.transformDocuments(ctx, ctx.params, doc);
				await this.entityChanged("created", json, ctx);
				return { 'id': json['_id'] };
			}
		},

		/**
		 * update the targetUrl in the database.
		 *
		 * @param {String} id - unique ID to identify the targetURL
		 * @param {String} newTargetURL - the new URL to be updated in database
		 * 
		 * @returns response
		 */
		update: {
			rest: "PUT /:id/update",
			params: {
				id: "string",
				newTargetURL: "string"
			},
			async handler(ctx) {
				const doc = await this.adapter.updateById(ctx.params.id, { $set: { target: ctx.params.newTargetURL } });
				if(!doc)
					return { 
						'Error': 'EntityNotFoundError',
						'id': ctx.params.id,
						'message': 'No such ID present in the database'
					}
				const json = await this.transformDocuments(ctx, ctx.params, doc);
				await this.entityChanged("updated", json, ctx);
				return { 
					'message': 'Updation Successful',
					'id': json['_id'],
					'updatedURL': json['target']
				};
			}
		},

		/**
		 * return all the targetURLs present in the database.
		 */
		 list: {
			cache: {
				keys: ["populate", "fields", "page", "pageSize", "sort", "search", "searchFields", "query"]
			},
			rest: "GET /list",
			params: {
				populate: [
					{ type: "string", optional: true },
					{ type: "array", optional: true, items: "string" },
				],
				fields: [
					{ type: "string", optional: true },
					{ type: "array", optional: true, items: "string" },
				],
				page: { type: "number", integer: true, min: 1, optional: true, convert: true },
				pageSize: { type: "number", integer: true, min: 0, optional: true, convert: true },
				sort: { type: "string", optional: true },
				search: { type: "string", optional: true },
				searchFields: [
					{ type: "string", optional: true },
					{ type: "array", optional: true, items: "string" },
				],
				query: [
					{ type: "object", optional: true },
					{ type: "string", optional: true },
				],
			},
			async handler(ctx) {
				let params = ctx.params;
				let countParams = Object.assign({}, params);
				// Remove pagination params
				if (countParams && countParams.limit)
					countParams.limit = null;
				if (countParams && countParams.offset)
					countParams.offset = null;
				if (params.limit == null) {
					if (this.settings.limit > 0 && params.pageSize > this.settings.limit)
						params.limit = this.settings.limit;
					else
						params.limit = params.pageSize;
				}
				return Promise.all([
					// Get rows
					this.adapter.find(params),
					// Get count of all rows
					this.adapter.count(countParams)
				]).then(res => {
					console.log(res);
					return this.transformDocuments(ctx, params, res[0])
						.then(docs => {
							var json = [];
							for (var i = 0; i < docs.length; i++) {
								json.push( docs[i]['target'] );
							}
							return json;
						});
				});
			}
		},

		/**
		 * send HTTP POST request to all the targetURLs
		 * in the database. The request body contains a 
		 * Json of ipAddress and UNIX time stamp. 
		 *
		 * @param {String} ipAddress - ip of the user
		 * 
		 * @returns
		 */
		trigger: {
			rest: "GET /ip",
			params: {
				ipAddress: "string"
			},
			async handler(ctx) {
				const targetURLs = await this.adapter.find();
				let batch = [];
				let statusCode = [];
				var ctr = 0;
				for (var i = 0; i < targetURLs.length; i++) {
					if(ctr === 10) {
						batch = [];
						ctr = 0;
						Promise.all(
							batch
						).then(res => {
							console.log(res);
						});
					} else {
						++ctr;
						batch.push( 
							axios.post(targetURLs[i]['target'], {
								ipAddress: ctx.params.ipAddress,
								timestamp: Date.now(),
							})
							.then(res => {
								console.log(`statusCode: ${res.statusCode}`)
								statusCode.push(res.statusCode);
								console.log(res)
							})
							.catch(error => {
								console.error(error)
							}))
						}
				}

				/**
				 * Bonus track part a
				 * running all the failed request maximum of 5 times until it succeeds
				 * 
				 * */
				for (var i = 0; i < statusCode.length; i++) {
					if(statusCode[i] != 200) {
						for(var j = 0; j < 5; j++) {
							axios.post(targetURLs[i]['target'], {
								ipAddress: ctx.params.ipAddress,
								timestamp: Date.now(),
							}).then(res => {
								console.log(`statusCode: ${res.statusCode}`)
								console.log(res)
								statusCode[i] = res.statusCode;
							});
							if(statusCode[i] === 200) {
								break;
							}
						}
					}
				}
			}
		}
	},

	/**
	 * Methods
	 */
	methods: {
		/**
		 * Loading sample data to the collection.
		 * It is called in the DB.mixin after the database
		 * connection establishing & the collection is empty.
		 */
		async seedDB(entity) {
			await this.adapter.insertMany([
				{ target: "localhost:3000/test1"},
				{ target: "localhost:3000/test2"},
				{ target: "localhost:3000/test3"},
				{ target: "localhost:3000/test4"},
			]);
		}
	},

	/**
	 * Fired after database connection establishing.
	 */
	async afterConnected() {
		// await this.adapter.collection.createIndex({ name: 1 });
	}
};
