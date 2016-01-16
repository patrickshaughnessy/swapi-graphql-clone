#!/usr/bin/env babel-node --optional es7.asyncFunctions

import request from 'request';

import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInt,
  GraphQLFloat,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLID,
  GraphQLBoolean
} from 'graphql';

import {
  connectionArgs,
  connectionDefinitions,
  connectionFromArray,
  connectionFromPromisedArray,
  connectionFromPromisedObject,
  fromGlobalId,
  globalIdField,
  mutationWithClientMutationId,
  nodeDefinitions,
} from 'graphql-relay';

var {nodeInterface, nodeField} = nodeDefinitions(
  (globalId) => {
    var {type, id} = fromGlobalId(globalId);
  },
  (obj) => {}
);

let pokedexType = new GraphQLObjectType({
  name: 'Pokedex',
  fields: () => ({
    created: new GraphQLString,
    modified: new GraphQLString,
    name: new GraphQLString,
    pokemon: {
      type: pokemonConnection,
      args: {
        ...connectionArgs
      },
      resolve: (obj, args) => {
        console.log('inside pokedex pokemon', 'obj', obj, 'args', args);
        return args;
      }
    },
    resource_uri: new GraphQLString
  }),
  interfaces: [nodeInterface]
})

let pokemonType = new GraphQLObjectType({
  name: 'Pokemon',
  fields: () => ({
    name: new GraphQLString
  }),
  interfaces: [nodeInterface]
})

let {connectionType: pokemonConnection} =
  connectionDefinitions({name: 'Pokemon', nodeType: pokemonType})

// let {connectionType: personConnection} =
//   connectionDefinitions({name: 'Person', nodeType: personType})


let queryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    node: nodeField,
    pokedex: {
      type: pokedexType,
      resolve: (_) => {
        let pokedex;
        let url = 'http://pokeapi.co/api/v1/pokedex/1/';
        return new Promise(function(resolve, reject){
          request(url, function(err, resp, body){
            pokedex = JSON.parse(body);
            resolve(pokedex);
          })
        })
      }
    }
  })
})

export var Schema = new GraphQLSchema({
  query: queryType
});
