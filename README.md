![Codeship Status](https://codeship.io/projects/c339dcf0-d4a8-0131-d880-3ea79a4fc40b/status)

A donation page for Non-profits using <a href="https://stripe.com">Stripe</a> written in <a href="http://meteor.com">Meteor</a>


## About

Give is used by Non-Profits to take donations using Stripe. Which includes Credit/Debit Cards, Bitcoin, Apple Pay and ACH. 


## Setup

At this point you will need a developer to use this software. Give is a working system, but it does take some knowledge of Meteor/Node.js to configure and make it useful for your organization. I'm working hard to make this something that any organization can use.

## Example

https://trashmountain.com/give

This is a live giving page, which is being used by Trash Mountain Project. 

## More

These are the integrations built into Give already

Payment Processing, including recurring gifts - Stripe

Mandrill (MailChimp's transactional email service) - Transactional emails (used for receipting and failure notices)

DonorTools, a CRM for non-profits.

You will need an account with each of these providers in order to use Give. The accounts are free up to a point. Stripe doesn't charge you a monthly fee, only a fee per transaction (2.9% + .30 per transaction). In order to use the ACH service you do need to escrow some money since ACH doesn't have the protections for the processor that credit cards do. ACH fees are $.25 per charge and there is no fee for transfers to your own bank account after charging the customer. 

## License

MIT
