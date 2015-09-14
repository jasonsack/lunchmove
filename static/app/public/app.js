(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
require('app/constants');

var Router = require('app/router');
var Spots = require('app/entities').Spots;
var Moves = require('app/entities').Moves;
var Move = require('app/entities').Move;
var channel = Backbone.Radio.channel('global');

var spots = new Spots();
var moves = new Moves();
var move = new Move(lunchmove.recent_move);

channel.reply('entities:spots', function(){
    return spots;
});

channel.reply('entities:moves', function(){
    return moves;
});

channel.reply('entities:move', function(){
    return move;
});

new Router();

Backbone.history.start({pushState: true});

},{"app/constants":2,"app/entities":3,"app/router":4}],2:[function(require,module,exports){
var channel = Backbone.Radio.channel('global');

var Constants = {
    RECENT_THRESHOLD: moment().subtract(6, 'hours')
};

channel.comply('get:constant', function(name){
    return Constants[name];
})

},{}],3:[function(require,module,exports){
var channel = Backbone.Radio.channel('global');



var Move = Backbone.Model.extend({
    urlRoot: '/json/moves/'
});

var GroupedMoves = Backbone.Collection.extend({
    comparator: function(model){
        var moves = model.get('moves');
        return moves ? -moves.length : 0;
    }
});

var Moves = Backbone.Collection.extend({
    url: '/json/moves/',
    parse: function(response){
        return response.results;
    },
    groupBySpot: function(){
        return this.reduce(function(collection, move){
            var model = collection.add({id: move.get('spot')});

            if (!model.has('moves')){
                model.set('moves', new Moves());
            }

            model.get('moves').add(move);

            return collection;
        }, new GroupedMoves());
    }
});

var Spot = Backbone.Model.extend({
    urlRoot: '/json/spots/'
});

var Spots = Backbone.Collection.extend({
    url: '/json/spots/',
    parse: function(response){
        return response.results;
    }
});

module.exports = {
    Spots: Spots,
    Moves: Moves,
    Move: Move,
    Spot: Spot
}

},{}],4:[function(require,module,exports){
var LunchMovesView = require('app/views').LunchMovesView;
var MoveFormView = require('app/views').MoveFormView;
var HeaderView = require('app/views').HeaderView;
var LoadingView = require('app/views').LoadingView;

var Move = require('app/entities').Move;
var channel = Backbone.Radio.channel('global');

var regionManager = new Marionette.RegionManager({
    regions: {
        main: '#app',
    }
});

var headerView = new HeaderView();

var Router = Backbone.Router.extend({
    routes: {
        "": "makeMove",
        "moves": "showMoves",
    },

    makeMove: function() {
        regionManager.get('main').show(new LoadingView());
        var move = channel.request('entities:move');
        var spots = channel.request('entities:spots');

        headerView.activate('makeMove');

        spots.fetch().done(function(){
            var formView = new MoveFormView({
                model: move
            });

            regionManager.get('main').show(formView);
        });
    },

    showMoves: function() {
        regionManager.get('main').show(new LoadingView());
        var move = channel.request('entities:move');
        var moves = channel.request('entities:moves');
        var spots = channel.request('entities:spots');

        headerView.activate('showMoves');

        $.when(moves.fetch(), spots.fetch()).done(function(){
            var listView = new LunchMovesView({
                model: move,
                collection: moves.groupBySpot()
            });
            regionManager.get('main').show(listView);
        });
    }

});

module.exports = Router;

},{"app/entities":3,"app/views":5}],5:[function(require,module,exports){

var EmptyTpl = "No one's going anywhere, just quite yet.\n";
var LunchMoveTpl = "<div class=\"spot-name col-md-6\">\n    <span><%= spotName %></span>\n</div>\n<div class=\"spot-moves col-md-6\">\n    <% moves.each(function(move){ %>\n        <div class=\"move\">\n            <div class=\"move-icon\">\n                <span class=\"glyphicon glyphicon-user\"></span>\n            </div>\n            <div class=\"move-name\">\n                <span><%= isOwnMove(move) ? 'You' : move.get('user') %></span>\n            </div>\n        </div>\n    <% }) %>\n    <% if (!hasOwnMove) { %>\n        <div class=\"move move-new\" data-ui=\"addMove\">\n            <div class=\"move-icon\">\n                <span class=\"glyphicon glyphicon-plus\"></span>\n            </div>\n            <div class=\"move-name\">\n                <span>Go Here</span>\n            </div>\n        </div>\n    <% } %>\n</div>\n";
var LunchMovesTpl = "<div class=\"container\">\n    <div class=\"row\">\n        <div class=\"col-md-12\">\n            <h1 class=\"text-center\">Lunch Moves!</h1>\n        </div>\n    </div>\n</div>\n<div class=\"container moves-container\">\n</div>\n";
var LoadingTpl = "<div class=\"container\">\n    <div class=\"row loading-container\">\n        <div class=\"sk-spinner sk-spinner-rotating-plane\"></div>\n    </div>\n</div>\n";
var MoveFormTpl = "<div class=\"jumbotron lunch-move-form\">\n    <div class=\"container\">\n        <div class=\"row\">\n            <div class=\"col-md-12 text-center\">\n                <h1 class=\"question\">What's your lunch move?</h1>\n                <form>\n                    <div class=\"form-inline\">\n                        <div class=\"form-group\">\n                            <input type=\"text\" class=\"form-control name-field\" name=\"user\" placeholder=\"you\">\n                        </div>\n                        <div class=\"form-group\">\n                            <p class=\"form-control-static\">is going to</p>\n                        </div>\n                        <div class=\"form-group\">\n                            <input class=\"form-control spot-field\" type=\"text\" name=\"spot\" placeholder=\"place\">\n                            <input type=\"hidden\" name=\"spot_id\">\n                        </div>\n                    </div>\n                </form>\n            </div>\n        </div>\n    </div>\n</div>\n";
var EmptyQueryTpl = "<div class=\"tt-empty\">\n    <button type=\"button\" class=\"btn btn-default\" data-action=\"addSpot\">Add \"<%= query %>\"</button>\n</div>\n";
var Spot = require('app/entities').Spot;

var channel = Backbone.Radio.channel('global');

var LunchMoveView = Marionette.ItemView.extend({
    modelEvents: {
        'change:moves': 'render'
    },
    edit: function(e){
        Backbone.history.navigate('', {trigger: true});
        e.preventDefault();
    },
    events: {
        'click @ui.addMove': 'addMove'
    },
    ui: {
        'addMove': '[data-ui="addMove"]'
    },
    addMove: function(){
        var view = this;
        var ownMove = channel.request('entities:move')
        ownMove.save({
            spot: this.model.id
        }).done(function(){
            var moves = channel.request('entities:moves');
            moves.add(ownMove, {merge: true});
            ownMove.trigger('update');
        });
    },
    className: 'row move-row',
    template: _.template(LunchMoveTpl),
    templateHelpers: function(){
        var ownMove =  channel.request('entities:move');
        return {
            spotName: channel.request('entities:spots').get(this.model.id).get('name'),
            isOwnMove: function(move){
                return ownMove.id === move.id;
            },
            hasOwnMove: !!this.model.get('moves').get(ownMove.id)
        }
    }
});

var EmptyView = Marionette.ItemView.extend({
    template: _.template(EmptyTpl)
});

var LunchMovesView = Marionette.CompositeView.extend({
    modelEvents: {
        'update': 'recalculateMoves'
    },
    template: _.template(LunchMovesTpl),
    childView: LunchMoveView,
    emptyView: EmptyView,
    childViewContainer: '.moves-container',
    recalculateMoves: function(){
        var previousSpot;

        this.collection.each(function(model){
            model.get('moves').each(function(move){
                if (move.id === this.model.id) {
                    previousSpot = model.id;
                }
            }, this);
        }, this);

        if (previousSpot) {
            var previousModel = this.collection.get(previousSpot);
            previousModel.get('moves').remove(this.model.id);
            previousModel.trigger('change:moves');
        }
        debugger;
        var newModel = this.collection.get(this.model.get('spot'));
        newModel.get('moves').add(this.model);
        newModel.trigger('change:moves');
    }
});

var MoveFormView = Marionette.ItemView.extend({
    template: _.template(MoveFormTpl),
    ui: {
        'form': 'form',
        'spot': '[name="spot"]',
        'spotId': '[name="spot_id"]',
        'user': '[name="user"]'
    },
    events: {
        'typeahead:select @ui.spot': 'onTypeaheadSelect',
        'click [data-action="addSpot"]': 'addSpot',
        'change @ui.form': 'onFormChange',
        'blur @ui.spot': 'onSpotBlur',
        'keydown input': function(e){
            if (e.keyCode === 13) {
                e.preventDefault();
                $(e.currentTarget).blur();
            }
        }
    },
    addSpot: function(){
        var spot = new Spot({
            name: this.ui.spot.typeahead('val')
        });

        spot.save({}, {
            success: _.bind(function(){
                channel.request('entities:spots').add(spot);
                this.ui.spot.typeahead('val', spot.get('name')).blur();
            }, this)
        });
    },
    deserializeModel: function(){
        var user = this.model.get('user');
        if (user) {
            this.ui.user.val(user);
        }
        var spot = this.model.get('spot')
        if (spot) {
            var spotName = channel.request('entities:spots').get(spot).get('name');
            this.ui.spot.typeahead('val', spotName);
        }
    },
    onShow: function(){
        this.renderTypeahead();
        this.deserializeModel();
    },
    renderTypeahead: function(){
        var spots = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            local: channel.request('entities:spots').toJSON()
        });

        this.ui.spot.typeahead({
            hint: true,
            highlight: true,
            minLength: 1
        },
        {
            display: 'name',
            name: 'spots',
            source: spots,
            templates: {
                empty: _.template(EmptyQueryTpl)
            }
        });
    },
    onFormChange: function(){
        if (this._disableSaving) {
            return;
        }

        var spotId = this.ui.spotId.val();
        var user = this.ui.user.val();

        if (spotId && user) {
            this._disableSaving = true;

            this.model.save({
                spot: spotId,
                user: user
            }, {
                success: function(){
                    Backbone.history.navigate('/moves', {trigger: true});
                }
            });
        }
    },
    onSpotBlur: function(){
        var spots = channel.request('entities:spots');
        var spotId = this.ui.spotId.val();

        if (!spotId) {
            var spotVal = this.ui.spot.typeahead('val');
            var selectedSpot = spots.find(function(spot){
                return spot.get('name').toLowerCase() == spotVal.toLowerCase();
            });

            if (selectedSpot) {
                this.ui.spotId.val(selectedSpot.id).change();
                spotId = selectedSpot.id;
            }
        }

        this.ui.spot.typeahead('val', spotId ? spots.get(+spotId).get('name') : '');
    },
    onTypeaheadSelect: function(e, obj){
        this.ui.spotId.val(obj.id).change();
    },
    templateHelpers: function(){
        return {
            spots: channel.request('entities:spots').toJSON()
        }
    }
});

var HeaderView = Marionette.ItemView.extend({
    el: '#header',
    events: {
        'click a': 'navigate'
    },
    template: false,
    activate: function(methodName){
        this.$('.navbar-nav li').removeClass('active');
        this.$('[data-action="' + methodName + '"]').addClass('active');
    },
    navigate: function(e){
        e.preventDefault();
        var route = $(e.currentTarget).attr('href').replace('../', '');
        Backbone.history.navigate(route, {trigger: true});
    }
});

var LoadingView = Marionette.ItemView.extend({
    template: _.template(LoadingTpl)
});



module.exports = {
    LunchMovesView: LunchMovesView,
    LoadingView: LoadingView,
    MoveFormView: MoveFormView,
    HeaderView: HeaderView
}

},{"app/entities":3}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvYXBwLmpzIiwibm9kZV9tb2R1bGVzL2FwcC9jb25zdGFudHMuanMiLCJub2RlX21vZHVsZXMvYXBwL2VudGl0aWVzLmpzIiwibm9kZV9tb2R1bGVzL2FwcC9yb3V0ZXIuanMiLCJub2RlX21vZHVsZXMvYXBwL3ZpZXdzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInJlcXVpcmUoJ2FwcC9jb25zdGFudHMnKTtcblxudmFyIFJvdXRlciA9IHJlcXVpcmUoJ2FwcC9yb3V0ZXInKTtcbnZhciBTcG90cyA9IHJlcXVpcmUoJ2FwcC9lbnRpdGllcycpLlNwb3RzO1xudmFyIE1vdmVzID0gcmVxdWlyZSgnYXBwL2VudGl0aWVzJykuTW92ZXM7XG52YXIgTW92ZSA9IHJlcXVpcmUoJ2FwcC9lbnRpdGllcycpLk1vdmU7XG52YXIgY2hhbm5lbCA9IEJhY2tib25lLlJhZGlvLmNoYW5uZWwoJ2dsb2JhbCcpO1xuXG52YXIgc3BvdHMgPSBuZXcgU3BvdHMoKTtcbnZhciBtb3ZlcyA9IG5ldyBNb3ZlcygpO1xudmFyIG1vdmUgPSBuZXcgTW92ZShsdW5jaG1vdmUucmVjZW50X21vdmUpO1xuXG5jaGFubmVsLnJlcGx5KCdlbnRpdGllczpzcG90cycsIGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIHNwb3RzO1xufSk7XG5cbmNoYW5uZWwucmVwbHkoJ2VudGl0aWVzOm1vdmVzJywgZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gbW92ZXM7XG59KTtcblxuY2hhbm5lbC5yZXBseSgnZW50aXRpZXM6bW92ZScsIGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIG1vdmU7XG59KTtcblxubmV3IFJvdXRlcigpO1xuXG5CYWNrYm9uZS5oaXN0b3J5LnN0YXJ0KHtwdXNoU3RhdGU6IHRydWV9KTtcbiIsInZhciBjaGFubmVsID0gQmFja2JvbmUuUmFkaW8uY2hhbm5lbCgnZ2xvYmFsJyk7XG5cbnZhciBDb25zdGFudHMgPSB7XG4gICAgUkVDRU5UX1RIUkVTSE9MRDogbW9tZW50KCkuc3VidHJhY3QoNiwgJ2hvdXJzJylcbn07XG5cbmNoYW5uZWwuY29tcGx5KCdnZXQ6Y29uc3RhbnQnLCBmdW5jdGlvbihuYW1lKXtcbiAgICByZXR1cm4gQ29uc3RhbnRzW25hbWVdO1xufSlcbiIsInZhciBjaGFubmVsID0gQmFja2JvbmUuUmFkaW8uY2hhbm5lbCgnZ2xvYmFsJyk7XG5cblxuXG52YXIgTW92ZSA9IEJhY2tib25lLk1vZGVsLmV4dGVuZCh7XG4gICAgdXJsUm9vdDogJy9qc29uL21vdmVzLydcbn0pO1xuXG52YXIgR3JvdXBlZE1vdmVzID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe1xuICAgIGNvbXBhcmF0b3I6IGZ1bmN0aW9uKG1vZGVsKXtcbiAgICAgICAgdmFyIG1vdmVzID0gbW9kZWwuZ2V0KCdtb3ZlcycpO1xuICAgICAgICByZXR1cm4gbW92ZXMgPyAtbW92ZXMubGVuZ3RoIDogMDtcbiAgICB9XG59KTtcblxudmFyIE1vdmVzID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe1xuICAgIHVybDogJy9qc29uL21vdmVzLycsXG4gICAgcGFyc2U6IGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLnJlc3VsdHM7XG4gICAgfSxcbiAgICBncm91cEJ5U3BvdDogZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVkdWNlKGZ1bmN0aW9uKGNvbGxlY3Rpb24sIG1vdmUpe1xuICAgICAgICAgICAgdmFyIG1vZGVsID0gY29sbGVjdGlvbi5hZGQoe2lkOiBtb3ZlLmdldCgnc3BvdCcpfSk7XG5cbiAgICAgICAgICAgIGlmICghbW9kZWwuaGFzKCdtb3ZlcycpKXtcbiAgICAgICAgICAgICAgICBtb2RlbC5zZXQoJ21vdmVzJywgbmV3IE1vdmVzKCkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBtb2RlbC5nZXQoJ21vdmVzJykuYWRkKG1vdmUpO1xuXG4gICAgICAgICAgICByZXR1cm4gY29sbGVjdGlvbjtcbiAgICAgICAgfSwgbmV3IEdyb3VwZWRNb3ZlcygpKTtcbiAgICB9XG59KTtcblxudmFyIFNwb3QgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoe1xuICAgIHVybFJvb3Q6ICcvanNvbi9zcG90cy8nXG59KTtcblxudmFyIFNwb3RzID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe1xuICAgIHVybDogJy9qc29uL3Nwb3RzLycsXG4gICAgcGFyc2U6IGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLnJlc3VsdHM7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIFNwb3RzOiBTcG90cyxcbiAgICBNb3ZlczogTW92ZXMsXG4gICAgTW92ZTogTW92ZSxcbiAgICBTcG90OiBTcG90XG59XG4iLCJ2YXIgTHVuY2hNb3Zlc1ZpZXcgPSByZXF1aXJlKCdhcHAvdmlld3MnKS5MdW5jaE1vdmVzVmlldztcbnZhciBNb3ZlRm9ybVZpZXcgPSByZXF1aXJlKCdhcHAvdmlld3MnKS5Nb3ZlRm9ybVZpZXc7XG52YXIgSGVhZGVyVmlldyA9IHJlcXVpcmUoJ2FwcC92aWV3cycpLkhlYWRlclZpZXc7XG52YXIgTG9hZGluZ1ZpZXcgPSByZXF1aXJlKCdhcHAvdmlld3MnKS5Mb2FkaW5nVmlldztcblxudmFyIE1vdmUgPSByZXF1aXJlKCdhcHAvZW50aXRpZXMnKS5Nb3ZlO1xudmFyIGNoYW5uZWwgPSBCYWNrYm9uZS5SYWRpby5jaGFubmVsKCdnbG9iYWwnKTtcblxudmFyIHJlZ2lvbk1hbmFnZXIgPSBuZXcgTWFyaW9uZXR0ZS5SZWdpb25NYW5hZ2VyKHtcbiAgICByZWdpb25zOiB7XG4gICAgICAgIG1haW46ICcjYXBwJyxcbiAgICB9XG59KTtcblxudmFyIGhlYWRlclZpZXcgPSBuZXcgSGVhZGVyVmlldygpO1xuXG52YXIgUm91dGVyID0gQmFja2JvbmUuUm91dGVyLmV4dGVuZCh7XG4gICAgcm91dGVzOiB7XG4gICAgICAgIFwiXCI6IFwibWFrZU1vdmVcIixcbiAgICAgICAgXCJtb3Zlc1wiOiBcInNob3dNb3Zlc1wiLFxuICAgIH0sXG5cbiAgICBtYWtlTW92ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlZ2lvbk1hbmFnZXIuZ2V0KCdtYWluJykuc2hvdyhuZXcgTG9hZGluZ1ZpZXcoKSk7XG4gICAgICAgIHZhciBtb3ZlID0gY2hhbm5lbC5yZXF1ZXN0KCdlbnRpdGllczptb3ZlJyk7XG4gICAgICAgIHZhciBzcG90cyA9IGNoYW5uZWwucmVxdWVzdCgnZW50aXRpZXM6c3BvdHMnKTtcblxuICAgICAgICBoZWFkZXJWaWV3LmFjdGl2YXRlKCdtYWtlTW92ZScpO1xuXG4gICAgICAgIHNwb3RzLmZldGNoKCkuZG9uZShmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIGZvcm1WaWV3ID0gbmV3IE1vdmVGb3JtVmlldyh7XG4gICAgICAgICAgICAgICAgbW9kZWw6IG1vdmVcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZWdpb25NYW5hZ2VyLmdldCgnbWFpbicpLnNob3coZm9ybVZpZXcpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgc2hvd01vdmVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVnaW9uTWFuYWdlci5nZXQoJ21haW4nKS5zaG93KG5ldyBMb2FkaW5nVmlldygpKTtcbiAgICAgICAgdmFyIG1vdmUgPSBjaGFubmVsLnJlcXVlc3QoJ2VudGl0aWVzOm1vdmUnKTtcbiAgICAgICAgdmFyIG1vdmVzID0gY2hhbm5lbC5yZXF1ZXN0KCdlbnRpdGllczptb3ZlcycpO1xuICAgICAgICB2YXIgc3BvdHMgPSBjaGFubmVsLnJlcXVlc3QoJ2VudGl0aWVzOnNwb3RzJyk7XG5cbiAgICAgICAgaGVhZGVyVmlldy5hY3RpdmF0ZSgnc2hvd01vdmVzJyk7XG5cbiAgICAgICAgJC53aGVuKG1vdmVzLmZldGNoKCksIHNwb3RzLmZldGNoKCkpLmRvbmUoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciBsaXN0VmlldyA9IG5ldyBMdW5jaE1vdmVzVmlldyh7XG4gICAgICAgICAgICAgICAgbW9kZWw6IG1vdmUsXG4gICAgICAgICAgICAgICAgY29sbGVjdGlvbjogbW92ZXMuZ3JvdXBCeVNwb3QoKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZWdpb25NYW5hZ2VyLmdldCgnbWFpbicpLnNob3cobGlzdFZpZXcpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJvdXRlcjtcbiIsIlxudmFyIEVtcHR5VHBsID0gXCJObyBvbmUncyBnb2luZyBhbnl3aGVyZSwganVzdCBxdWl0ZSB5ZXQuXFxuXCI7XG52YXIgTHVuY2hNb3ZlVHBsID0gXCI8ZGl2IGNsYXNzPVxcXCJzcG90LW5hbWUgY29sLW1kLTZcXFwiPlxcbiAgICA8c3Bhbj48JT0gc3BvdE5hbWUgJT48L3NwYW4+XFxuPC9kaXY+XFxuPGRpdiBjbGFzcz1cXFwic3BvdC1tb3ZlcyBjb2wtbWQtNlxcXCI+XFxuICAgIDwlIG1vdmVzLmVhY2goZnVuY3Rpb24obW92ZSl7ICU+XFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJtb3ZlXFxcIj5cXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJtb3ZlLWljb25cXFwiPlxcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiZ2x5cGhpY29uIGdseXBoaWNvbi11c2VyXFxcIj48L3NwYW4+XFxuICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwibW92ZS1uYW1lXFxcIj5cXG4gICAgICAgICAgICAgICAgPHNwYW4+PCU9IGlzT3duTW92ZShtb3ZlKSA/ICdZb3UnIDogbW92ZS5nZXQoJ3VzZXInKSAlPjwvc3Bhbj5cXG4gICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgIDwvZGl2PlxcbiAgICA8JSB9KSAlPlxcbiAgICA8JSBpZiAoIWhhc093bk1vdmUpIHsgJT5cXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcIm1vdmUgbW92ZS1uZXdcXFwiIGRhdGEtdWk9XFxcImFkZE1vdmVcXFwiPlxcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcIm1vdmUtaWNvblxcXCI+XFxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJnbHlwaGljb24gZ2x5cGhpY29uLXBsdXNcXFwiPjwvc3Bhbj5cXG4gICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJtb3ZlLW5hbWVcXFwiPlxcbiAgICAgICAgICAgICAgICA8c3Bhbj5HbyBIZXJlPC9zcGFuPlxcbiAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgPC9kaXY+XFxuICAgIDwlIH0gJT5cXG48L2Rpdj5cXG5cIjtcbnZhciBMdW5jaE1vdmVzVHBsID0gXCI8ZGl2IGNsYXNzPVxcXCJjb250YWluZXJcXFwiPlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJyb3dcXFwiPlxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiY29sLW1kLTEyXFxcIj5cXG4gICAgICAgICAgICA8aDEgY2xhc3M9XFxcInRleHQtY2VudGVyXFxcIj5MdW5jaCBNb3ZlcyE8L2gxPlxcbiAgICAgICAgPC9kaXY+XFxuICAgIDwvZGl2PlxcbjwvZGl2PlxcbjxkaXYgY2xhc3M9XFxcImNvbnRhaW5lciBtb3Zlcy1jb250YWluZXJcXFwiPlxcbjwvZGl2PlxcblwiO1xudmFyIExvYWRpbmdUcGwgPSBcIjxkaXYgY2xhc3M9XFxcImNvbnRhaW5lclxcXCI+XFxuICAgIDxkaXYgY2xhc3M9XFxcInJvdyBsb2FkaW5nLWNvbnRhaW5lclxcXCI+XFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJzay1zcGlubmVyIHNrLXNwaW5uZXItcm90YXRpbmctcGxhbmVcXFwiPjwvZGl2PlxcbiAgICA8L2Rpdj5cXG48L2Rpdj5cXG5cIjtcbnZhciBNb3ZlRm9ybVRwbCA9IFwiPGRpdiBjbGFzcz1cXFwianVtYm90cm9uIGx1bmNoLW1vdmUtZm9ybVxcXCI+XFxuICAgIDxkaXYgY2xhc3M9XFxcImNvbnRhaW5lclxcXCI+XFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJyb3dcXFwiPlxcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcImNvbC1tZC0xMiB0ZXh0LWNlbnRlclxcXCI+XFxuICAgICAgICAgICAgICAgIDxoMSBjbGFzcz1cXFwicXVlc3Rpb25cXFwiPldoYXQncyB5b3VyIGx1bmNoIG1vdmU/PC9oMT5cXG4gICAgICAgICAgICAgICAgPGZvcm0+XFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJmb3JtLWlubGluZVxcXCI+XFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cFxcXCI+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwiZm9ybS1jb250cm9sIG5hbWUtZmllbGRcXFwiIG5hbWU9XFxcInVzZXJcXFwiIHBsYWNlaG9sZGVyPVxcXCJ5b3VcXFwiPlxcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcImZvcm0tZ3JvdXBcXFwiPlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzcz1cXFwiZm9ybS1jb250cm9sLXN0YXRpY1xcXCI+aXMgZ29pbmcgdG88L3A+XFxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cFxcXCI+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzcz1cXFwiZm9ybS1jb250cm9sIHNwb3QtZmllbGRcXFwiIHR5cGU9XFxcInRleHRcXFwiIG5hbWU9XFxcInNwb3RcXFwiIHBsYWNlaG9sZGVyPVxcXCJwbGFjZVxcXCI+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJoaWRkZW5cXFwiIG5hbWU9XFxcInNwb3RfaWRcXFwiPlxcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgICAgIDwvZm9ybT5cXG4gICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgIDwvZGl2PlxcbiAgICA8L2Rpdj5cXG48L2Rpdj5cXG5cIjtcbnZhciBFbXB0eVF1ZXJ5VHBsID0gXCI8ZGl2IGNsYXNzPVxcXCJ0dC1lbXB0eVxcXCI+XFxuICAgIDxidXR0b24gdHlwZT1cXFwiYnV0dG9uXFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1kZWZhdWx0XFxcIiBkYXRhLWFjdGlvbj1cXFwiYWRkU3BvdFxcXCI+QWRkIFxcXCI8JT0gcXVlcnkgJT5cXFwiPC9idXR0b24+XFxuPC9kaXY+XFxuXCI7XG52YXIgU3BvdCA9IHJlcXVpcmUoJ2FwcC9lbnRpdGllcycpLlNwb3Q7XG5cbnZhciBjaGFubmVsID0gQmFja2JvbmUuUmFkaW8uY2hhbm5lbCgnZ2xvYmFsJyk7XG5cbnZhciBMdW5jaE1vdmVWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xuICAgIG1vZGVsRXZlbnRzOiB7XG4gICAgICAgICdjaGFuZ2U6bW92ZXMnOiAncmVuZGVyJ1xuICAgIH0sXG4gICAgZWRpdDogZnVuY3Rpb24oZSl7XG4gICAgICAgIEJhY2tib25lLmhpc3RvcnkubmF2aWdhdGUoJycsIHt0cmlnZ2VyOiB0cnVlfSk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9LFxuICAgIGV2ZW50czoge1xuICAgICAgICAnY2xpY2sgQHVpLmFkZE1vdmUnOiAnYWRkTW92ZSdcbiAgICB9LFxuICAgIHVpOiB7XG4gICAgICAgICdhZGRNb3ZlJzogJ1tkYXRhLXVpPVwiYWRkTW92ZVwiXSdcbiAgICB9LFxuICAgIGFkZE1vdmU6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciB2aWV3ID0gdGhpcztcbiAgICAgICAgdmFyIG93bk1vdmUgPSBjaGFubmVsLnJlcXVlc3QoJ2VudGl0aWVzOm1vdmUnKVxuICAgICAgICBvd25Nb3ZlLnNhdmUoe1xuICAgICAgICAgICAgc3BvdDogdGhpcy5tb2RlbC5pZFxuICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgbW92ZXMgPSBjaGFubmVsLnJlcXVlc3QoJ2VudGl0aWVzOm1vdmVzJyk7XG4gICAgICAgICAgICBtb3Zlcy5hZGQob3duTW92ZSwge21lcmdlOiB0cnVlfSk7XG4gICAgICAgICAgICBvd25Nb3ZlLnRyaWdnZXIoJ3VwZGF0ZScpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGNsYXNzTmFtZTogJ3JvdyBtb3ZlLXJvdycsXG4gICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoTHVuY2hNb3ZlVHBsKSxcbiAgICB0ZW1wbGF0ZUhlbHBlcnM6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBvd25Nb3ZlID0gIGNoYW5uZWwucmVxdWVzdCgnZW50aXRpZXM6bW92ZScpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3BvdE5hbWU6IGNoYW5uZWwucmVxdWVzdCgnZW50aXRpZXM6c3BvdHMnKS5nZXQodGhpcy5tb2RlbC5pZCkuZ2V0KCduYW1lJyksXG4gICAgICAgICAgICBpc093bk1vdmU6IGZ1bmN0aW9uKG1vdmUpe1xuICAgICAgICAgICAgICAgIHJldHVybiBvd25Nb3ZlLmlkID09PSBtb3ZlLmlkO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGhhc093bk1vdmU6ICEhdGhpcy5tb2RlbC5nZXQoJ21vdmVzJykuZ2V0KG93bk1vdmUuaWQpXG4gICAgICAgIH1cbiAgICB9XG59KTtcblxudmFyIEVtcHR5VmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcbiAgICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZShFbXB0eVRwbClcbn0pO1xuXG52YXIgTHVuY2hNb3Zlc1ZpZXcgPSBNYXJpb25ldHRlLkNvbXBvc2l0ZVZpZXcuZXh0ZW5kKHtcbiAgICBtb2RlbEV2ZW50czoge1xuICAgICAgICAndXBkYXRlJzogJ3JlY2FsY3VsYXRlTW92ZXMnXG4gICAgfSxcbiAgICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZShMdW5jaE1vdmVzVHBsKSxcbiAgICBjaGlsZFZpZXc6IEx1bmNoTW92ZVZpZXcsXG4gICAgZW1wdHlWaWV3OiBFbXB0eVZpZXcsXG4gICAgY2hpbGRWaWV3Q29udGFpbmVyOiAnLm1vdmVzLWNvbnRhaW5lcicsXG4gICAgcmVjYWxjdWxhdGVNb3ZlczogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHByZXZpb3VzU3BvdDtcblxuICAgICAgICB0aGlzLmNvbGxlY3Rpb24uZWFjaChmdW5jdGlvbihtb2RlbCl7XG4gICAgICAgICAgICBtb2RlbC5nZXQoJ21vdmVzJykuZWFjaChmdW5jdGlvbihtb3ZlKXtcbiAgICAgICAgICAgICAgICBpZiAobW92ZS5pZCA9PT0gdGhpcy5tb2RlbC5pZCkge1xuICAgICAgICAgICAgICAgICAgICBwcmV2aW91c1Nwb3QgPSBtb2RlbC5pZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgaWYgKHByZXZpb3VzU3BvdCkge1xuICAgICAgICAgICAgdmFyIHByZXZpb3VzTW9kZWwgPSB0aGlzLmNvbGxlY3Rpb24uZ2V0KHByZXZpb3VzU3BvdCk7XG4gICAgICAgICAgICBwcmV2aW91c01vZGVsLmdldCgnbW92ZXMnKS5yZW1vdmUodGhpcy5tb2RlbC5pZCk7XG4gICAgICAgICAgICBwcmV2aW91c01vZGVsLnRyaWdnZXIoJ2NoYW5nZTptb3ZlcycpO1xuICAgICAgICB9XG4gICAgICAgIGRlYnVnZ2VyO1xuICAgICAgICB2YXIgbmV3TW9kZWwgPSB0aGlzLmNvbGxlY3Rpb24uZ2V0KHRoaXMubW9kZWwuZ2V0KCdzcG90JykpO1xuICAgICAgICBuZXdNb2RlbC5nZXQoJ21vdmVzJykuYWRkKHRoaXMubW9kZWwpO1xuICAgICAgICBuZXdNb2RlbC50cmlnZ2VyKCdjaGFuZ2U6bW92ZXMnKTtcbiAgICB9XG59KTtcblxudmFyIE1vdmVGb3JtVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcbiAgICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZShNb3ZlRm9ybVRwbCksXG4gICAgdWk6IHtcbiAgICAgICAgJ2Zvcm0nOiAnZm9ybScsXG4gICAgICAgICdzcG90JzogJ1tuYW1lPVwic3BvdFwiXScsXG4gICAgICAgICdzcG90SWQnOiAnW25hbWU9XCJzcG90X2lkXCJdJyxcbiAgICAgICAgJ3VzZXInOiAnW25hbWU9XCJ1c2VyXCJdJ1xuICAgIH0sXG4gICAgZXZlbnRzOiB7XG4gICAgICAgICd0eXBlYWhlYWQ6c2VsZWN0IEB1aS5zcG90JzogJ29uVHlwZWFoZWFkU2VsZWN0JyxcbiAgICAgICAgJ2NsaWNrIFtkYXRhLWFjdGlvbj1cImFkZFNwb3RcIl0nOiAnYWRkU3BvdCcsXG4gICAgICAgICdjaGFuZ2UgQHVpLmZvcm0nOiAnb25Gb3JtQ2hhbmdlJyxcbiAgICAgICAgJ2JsdXIgQHVpLnNwb3QnOiAnb25TcG90Qmx1cicsXG4gICAgICAgICdrZXlkb3duIGlucHV0JzogZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICBpZiAoZS5rZXlDb2RlID09PSAxMykge1xuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAkKGUuY3VycmVudFRhcmdldCkuYmx1cigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBhZGRTcG90OiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgc3BvdCA9IG5ldyBTcG90KHtcbiAgICAgICAgICAgIG5hbWU6IHRoaXMudWkuc3BvdC50eXBlYWhlYWQoJ3ZhbCcpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNwb3Quc2F2ZSh7fSwge1xuICAgICAgICAgICAgc3VjY2VzczogXy5iaW5kKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgY2hhbm5lbC5yZXF1ZXN0KCdlbnRpdGllczpzcG90cycpLmFkZChzcG90KTtcbiAgICAgICAgICAgICAgICB0aGlzLnVpLnNwb3QudHlwZWFoZWFkKCd2YWwnLCBzcG90LmdldCgnbmFtZScpKS5ibHVyKCk7XG4gICAgICAgICAgICB9LCB0aGlzKVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGRlc2VyaWFsaXplTW9kZWw6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciB1c2VyID0gdGhpcy5tb2RlbC5nZXQoJ3VzZXInKTtcbiAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMudWkudXNlci52YWwodXNlcik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHNwb3QgPSB0aGlzLm1vZGVsLmdldCgnc3BvdCcpXG4gICAgICAgIGlmIChzcG90KSB7XG4gICAgICAgICAgICB2YXIgc3BvdE5hbWUgPSBjaGFubmVsLnJlcXVlc3QoJ2VudGl0aWVzOnNwb3RzJykuZ2V0KHNwb3QpLmdldCgnbmFtZScpO1xuICAgICAgICAgICAgdGhpcy51aS5zcG90LnR5cGVhaGVhZCgndmFsJywgc3BvdE5hbWUpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBvblNob3c6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHRoaXMucmVuZGVyVHlwZWFoZWFkKCk7XG4gICAgICAgIHRoaXMuZGVzZXJpYWxpemVNb2RlbCgpO1xuICAgIH0sXG4gICAgcmVuZGVyVHlwZWFoZWFkOiBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgc3BvdHMgPSBuZXcgQmxvb2Rob3VuZCh7XG4gICAgICAgICAgICBkYXR1bVRva2VuaXplcjogQmxvb2Rob3VuZC50b2tlbml6ZXJzLm9iai53aGl0ZXNwYWNlKCduYW1lJyksXG4gICAgICAgICAgICBxdWVyeVRva2VuaXplcjogQmxvb2Rob3VuZC50b2tlbml6ZXJzLndoaXRlc3BhY2UsXG4gICAgICAgICAgICBsb2NhbDogY2hhbm5lbC5yZXF1ZXN0KCdlbnRpdGllczpzcG90cycpLnRvSlNPTigpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMudWkuc3BvdC50eXBlYWhlYWQoe1xuICAgICAgICAgICAgaGludDogdHJ1ZSxcbiAgICAgICAgICAgIGhpZ2hsaWdodDogdHJ1ZSxcbiAgICAgICAgICAgIG1pbkxlbmd0aDogMVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBkaXNwbGF5OiAnbmFtZScsXG4gICAgICAgICAgICBuYW1lOiAnc3BvdHMnLFxuICAgICAgICAgICAgc291cmNlOiBzcG90cyxcbiAgICAgICAgICAgIHRlbXBsYXRlczoge1xuICAgICAgICAgICAgICAgIGVtcHR5OiBfLnRlbXBsYXRlKEVtcHR5UXVlcnlUcGwpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgb25Gb3JtQ2hhbmdlOiBmdW5jdGlvbigpe1xuICAgICAgICBpZiAodGhpcy5fZGlzYWJsZVNhdmluZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHNwb3RJZCA9IHRoaXMudWkuc3BvdElkLnZhbCgpO1xuICAgICAgICB2YXIgdXNlciA9IHRoaXMudWkudXNlci52YWwoKTtcblxuICAgICAgICBpZiAoc3BvdElkICYmIHVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX2Rpc2FibGVTYXZpbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICB0aGlzLm1vZGVsLnNhdmUoe1xuICAgICAgICAgICAgICAgIHNwb3Q6IHNwb3RJZCxcbiAgICAgICAgICAgICAgICB1c2VyOiB1c2VyXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgQmFja2JvbmUuaGlzdG9yeS5uYXZpZ2F0ZSgnL21vdmVzJywge3RyaWdnZXI6IHRydWV9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgb25TcG90Qmx1cjogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHNwb3RzID0gY2hhbm5lbC5yZXF1ZXN0KCdlbnRpdGllczpzcG90cycpO1xuICAgICAgICB2YXIgc3BvdElkID0gdGhpcy51aS5zcG90SWQudmFsKCk7XG5cbiAgICAgICAgaWYgKCFzcG90SWQpIHtcbiAgICAgICAgICAgIHZhciBzcG90VmFsID0gdGhpcy51aS5zcG90LnR5cGVhaGVhZCgndmFsJyk7XG4gICAgICAgICAgICB2YXIgc2VsZWN0ZWRTcG90ID0gc3BvdHMuZmluZChmdW5jdGlvbihzcG90KXtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3BvdC5nZXQoJ25hbWUnKS50b0xvd2VyQ2FzZSgpID09IHNwb3RWYWwudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAoc2VsZWN0ZWRTcG90KSB7XG4gICAgICAgICAgICAgICAgdGhpcy51aS5zcG90SWQudmFsKHNlbGVjdGVkU3BvdC5pZCkuY2hhbmdlKCk7XG4gICAgICAgICAgICAgICAgc3BvdElkID0gc2VsZWN0ZWRTcG90LmlkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy51aS5zcG90LnR5cGVhaGVhZCgndmFsJywgc3BvdElkID8gc3BvdHMuZ2V0KCtzcG90SWQpLmdldCgnbmFtZScpIDogJycpO1xuICAgIH0sXG4gICAgb25UeXBlYWhlYWRTZWxlY3Q6IGZ1bmN0aW9uKGUsIG9iail7XG4gICAgICAgIHRoaXMudWkuc3BvdElkLnZhbChvYmouaWQpLmNoYW5nZSgpO1xuICAgIH0sXG4gICAgdGVtcGxhdGVIZWxwZXJzOiBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3BvdHM6IGNoYW5uZWwucmVxdWVzdCgnZW50aXRpZXM6c3BvdHMnKS50b0pTT04oKVxuICAgICAgICB9XG4gICAgfVxufSk7XG5cbnZhciBIZWFkZXJWaWV3ID0gTWFyaW9uZXR0ZS5JdGVtVmlldy5leHRlbmQoe1xuICAgIGVsOiAnI2hlYWRlcicsXG4gICAgZXZlbnRzOiB7XG4gICAgICAgICdjbGljayBhJzogJ25hdmlnYXRlJ1xuICAgIH0sXG4gICAgdGVtcGxhdGU6IGZhbHNlLFxuICAgIGFjdGl2YXRlOiBmdW5jdGlvbihtZXRob2ROYW1lKXtcbiAgICAgICAgdGhpcy4kKCcubmF2YmFyLW5hdiBsaScpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgdGhpcy4kKCdbZGF0YS1hY3Rpb249XCInICsgbWV0aG9kTmFtZSArICdcIl0nKS5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgfSxcbiAgICBuYXZpZ2F0ZTogZnVuY3Rpb24oZSl7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdmFyIHJvdXRlID0gJChlLmN1cnJlbnRUYXJnZXQpLmF0dHIoJ2hyZWYnKS5yZXBsYWNlKCcuLi8nLCAnJyk7XG4gICAgICAgIEJhY2tib25lLmhpc3RvcnkubmF2aWdhdGUocm91dGUsIHt0cmlnZ2VyOiB0cnVlfSk7XG4gICAgfVxufSk7XG5cbnZhciBMb2FkaW5nVmlldyA9IE1hcmlvbmV0dGUuSXRlbVZpZXcuZXh0ZW5kKHtcbiAgICB0ZW1wbGF0ZTogXy50ZW1wbGF0ZShMb2FkaW5nVHBsKVxufSk7XG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBMdW5jaE1vdmVzVmlldzogTHVuY2hNb3Zlc1ZpZXcsXG4gICAgTG9hZGluZ1ZpZXc6IExvYWRpbmdWaWV3LFxuICAgIE1vdmVGb3JtVmlldzogTW92ZUZvcm1WaWV3LFxuICAgIEhlYWRlclZpZXc6IEhlYWRlclZpZXdcbn1cbiJdfQ==
