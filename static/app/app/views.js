var fs = require('fs');
var EmptyTpl = fs.readFileSync(__dirname + '/templates/empty-moves.html', 'utf8');
var LunchMoveTpl = fs.readFileSync(__dirname + '/templates/lunch-move.html', 'utf8');
var LunchMovesTpl = fs.readFileSync(__dirname + '/templates/lunch-moves.html', 'utf8');

var channel = Backbone.Radio.channel('global');

var LunchMoveView = Marionette.ItemView.extend({
    tagName: 'li',
    className: 'list-group-item',
    template: _.template(LunchMoveTpl),
    templateHelpers: {
        spotName: function(){
            return channel.request('entities:spots').get(this.spot).get('name');
        }
    }
});

var EmptyView = Marionette.ItemView.extend({
    tagName: 'li',
    className: 'list-group-item',
    template: _.template(EmptyTpl)
});

var LunchMovesView = Marionette.CompositeView.extend({
    ui: {
        'form': 'form'
    },
    events: {
        'submit @ui.form': 'submitMove'
    },
    emptyView: EmptyView,
    childView: LunchMoveView,
    childViewContainer: 'ul',
    template: _.template(LunchMovesTpl),
    submitMove: function(e){
        var spot = this.ui.form.find('[name="spot"]').val();
        var user = this.ui.form.find('[name="user"]').val();

        this.model.save({
            spot: spot,
            user: user
        }, {
            success: _.bind(function(){
                this.ui.form.hide();
            }, this)
        });

        e.preventDefault();
    },
    templateHelpers: function(){
        var spots = channel.request('entities:spots');

        return {
            spots: spots.toJSON()
        }
    }
});

module.exports = {
    LunchMovesView: LunchMovesView
}