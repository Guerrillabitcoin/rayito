import user from './user'
import message from './message'
import item from './item'
import wallet from './wallet'
import lnurl from './lnurl'
import notifications from './notifications'
import invite from './invite'
import sub from './sub'
import upload from './upload'
import growth from './growth'
import search from './search'
import { GraphQLJSONObject } from 'graphql-type-json'

export default [user, item, message, wallet, lnurl, notifications, invite, sub,
  upload, growth, search, { JSONObject: GraphQLJSONObject }]
