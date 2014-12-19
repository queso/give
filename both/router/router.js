Router.configure({
  layoutTemplate: 'MasterLayout',
  loadingTemplate: 'Loading',
  notFoundTemplate: 'NotFound',
  templateNameConverter: 'upperCamelCase',
  routeControllerNameConverter: 'upperCamelCase'
});

Router.onBeforeAction(function () {
    if(!Meteor.user()) {
        // if the user is not logged in, render the Login template
        this.render('Login');
    } else {
        // otherwise don't hold up the rest of hooks or our route/action function from running
        this.next();
    }
    }, {
    except: ['donation.form', 'donation.thanks', 'enrollAccount']
});

Router.route(':root', function () {
    var root = Meteor.settings.public.root;
    var params = this.params;
    
    Session.set('params.donateTo', params.query.donateTo);
    Session.set('params.amount', params.query.amount);
    Session.set('params.donateWith', params.query.donateWith);
    Session.set('params.recurring', params.query.recurring);
    Session.set('params.writeIn', params.query.writeIn);
    Session.set('params.enteredWriteInValue', params.query.enteredWriteInValue);
    
    this.render('DonationForm');
}, {
    name: 'donation.form'
});

Router.route(':root/thanks', {
    name: 'donation.thanks',
    waitOn: function () {
        return  [
            Meteor.subscribe('receipt_donations', this.params.query.don),
            Meteor.subscribe('receipt_customers', this.params.query.c),
            Meteor.subscribe('receipt_debits', this.params.query.deb)
        ];
    },
    data: function () {
        var root = Meteor.settings.public.root;
    },
    action: function () {
        this.render('Thanks', {
            data: function () {
                Session.set('print', this.params.query.print);
            }
        });
    }
});

Router.route(':root/dashboard', function () {
    this.layout('AdminLayout');
    var root = Meteor.settings.public.root;

    if (this.ready()) {
        this.render('Dashboard');
    }else {
        this.render('Loading');
    }
}, {
    name: 'admin.dashboard'
});

Router.route(':root/transactions', function () {
    this.layout('AdminLayout');
    var root = Meteor.settings.public.root;

    this.subscribe('donate_list').wait();

    if (this.ready()) {
        this.render('Transactions');
        this.next();
    }else {
        this.render('Loading');
        this.next();
    }
});

Router.route(':root/subscription/:_id', function () {
    this.layout('AdminLayout');
    var root = Meteor.settings.public.root;

    this.subscribe('donate', this.params._id).wait();

    if (this.ready()) {
        this.render('Subscription', {
            data: function () {
                return Donate.findOne(this.params._id);
            }
        });
        this.next();
    }else {
        this.render('Loading');
        this.next();
    }
});

Router.route(':root/order/:_id', function () {
    this.layout('AdminLayout');
    var root = Meteor.settings.public.root;

    this.subscribe('donate', this.params._id).wait();

    if (this.ready()) {
        this.render('Order', {
            data: function () {
                return Donate.findOne(this.params._id);
            }
        });
        this.next();
    }else {
        this.render('Loading');
        this.next();
    }
});

Router.route(':root/tables', {
    template: 'Tables',
    name: 'admin.tables',
    layoutTemplate: 'AdminLayout',
    data: function () {
        var root = Meteor.settings.public.root;
    },
    action: function () {
        this.render('Tables')
    }
});

Router.route(':root/report', {
    name: 'admin.report',
    template: 'Report',
    layoutTemplate: 'AdminLayout',

    waitOn: function () {
        var query = this.params.query;
        Session.set('startDate', query.startDate);
        Session.set('endDate', query.endDate);
        return Meteor.subscribe('give_report', query.startDate, query.endDate);
    },
    data: function () {
        var root = Meteor.settings.public.root;
    }
});

Router.route(':root/expiring', {
    name: 'admin.expiring',
    template: 'Expiring',
    layoutTemplate: 'AdminLayout',

    waitOn: function () {
        return Meteor.subscribe('card_expiring');
    },
    data: function () {
        var root = Meteor.settings.public.root;
    }
});

Router.route(':root/user/:_id', function () {
    this.layout('UserLayout');
    var root = Meteor.settings.public.root;

    this.subscribe('userDataPublish', this.params._id).wait();
    this.subscribe('userDebits').wait();
    this.subscribe('userDonations').wait();
    this.subscribe('userCustomers').wait();

    if (this.ready()) {
        this.render('UserProfile', {
            data: function () {
                return Meteor.users.find(this.params._id);
            }
        });
        this.next();
    } else {
        this.render('Loading');
        this.next();
    }
}, {
    name: 'user.profile'
});