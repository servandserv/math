(function(w){
	
	w.app = w.app || {
		Model: {},
		Collection: {},
		View: {},
		Router: {},
		Utils: {}
	};

	app.Utils.RandomInt = function(max,min) {
		return Math.floor(Math.random() * (max - min)) + min;
	};

	app.Model.Fraction = Backbone.Model.extend({
		defaults: function() {
			return {
				wholenumber: null,
				numerator: null,
				denominator: null,
				options: {
					wholeRange: [1,10],
					numeratorRange: [1,10],
					denominatorRange: [2,10],
					type: 'improper',
				}
			}
		},

		initialize: function(options) {
			//console.log(this.randomInt(this.get('options').wholeRange));
			if( this.get('wholenumber') == null || this.get('numerator') == null || this.get('denominator') == null ) {
				var whole = this.randomInt(this.get('options').wholeRange)
				this.set('wholenumber',whole);
				var num = this.randomInt(this.get('options').numeratorRange);
				this.set('numerator',num);
				var denRange = [];
				var den = this.randomInt([num+1,this.get('options').denominatorRange[1]]);
				this.set('denominator',den);
			}
		},

		toDecimal: function() {
			return (this.get('numerator') + this.get('denominator')*this.get('wholenumber')) / this.get('denominator');
		},

		simplify: function() {
			var next = true;
			var a = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
			var data = this.toJSON();

			while(next) {
				next = false;
				for (var i=0; i<=a.length; i++) {
					if(data.numerator%a[i] == 0 && data.denominator%a[i] == 0 ) {
						data.numerator = data.numerator / a[i];
						data.denominator = data.denominator / a[i];
						next = true;
					}
				}
			}
			return new app.Model.Fraction(data);
		},

		toMixed: function() {
			var data = this.toJSON();
			if(data.numerator > data.denominator) {
				var whole = Math.floor( data.numerator / data.denominator );
				var num = data.numerator - whole * data.denominator;
				data.wholenumber = data.wholenumber + whole;
				data.numerator = num;
			} else if( data.numerator == data.denominator ) {
				data.wholenumber = 1;
				data.numerator = 0;
				data.denominator = 1;
			}
			return new app.Model.Fraction(data);
		},

		toImproper: function() {
			return new app.Model.Fraction({
				wholenumber: 0,
				numerator: this.get('numerator') + this.get('wholenumber') * this.get('denominator'),
				denominator: this.get('denominator'),
			});
		},

		rize: function(factor) {
			return new app.Model.Fraction({
				wholenumber: this.get('wholenumber'),
				numerator: this.get('numerator')*factor,
				denominator: this.get('denominator')*factor,
			});
		},
	
		randomInt: function(minmax) {
			return Math.floor(Math.random() * (1 + minmax[1] - minmax[0]) + minmax[0]);
		},

		equal: function(fraction) {

			return ( this.get('wholenumber') == fraction.get('wholenumber') &&
				this.get('numerator') == fraction.get('numerator') && 
				this.get('denominator') == fraction.get('denominator') ) || 
				( this.get('wholenumber') == fraction.get('wholenumber') && 
				this.get('numerator') == this.get('denominator') && 
				fraction.get('numerator') == fraction.get('denominator')) ||
				( this.get('wholenumber') == fraction.get('wholenumber') && 
				this.get('numerator') == 0 && 
				fraction.get('numerator') == 0 );
		},

		compare: function(fraction) {
			if(this.toDecimal() > fraction.toDecimal()) {
				return ">";
			} else if(this.toDecimal() < fraction.toDecimal()) {
				return "<";
			} else {
				return "=";
			}
		},

		add: function(fraction) {
			first = this.toImproper();
			second = fraction.toImproper();
			var commonDen = first.get('denominator') * second.get('denominator');
			var commonNum = first.get('numerator') * second.get('denominator') + second.get('numerator') * first.get('denominator');
			var answer = new app.Model.Fraction({
				wholenumber:0,
				numerator: commonNum,
				denominator: commonDen,
			});
			return answer.simplify().toMixed();
		},

		sub: function(fraction) {
			first = this.toImproper();
			second = fraction.toImproper();
			var commonDen = first.get('denominator') * second.get('denominator');
			var commonNum = first.get('numerator') * second.get('denominator') - second.get('numerator') * first.get('denominator');
			var answer = new app.Model.Fraction({
				wholenumber:0,
				numerator: commonNum,
				denominator: commonDen,
			});
			return answer.simplify().toMixed();
		},

		mult: function(fraction) {
			first = this.toImproper();
			second = fraction.toImproper();
			var commonDen = first.get('denominator') * second.get('denominator');
			var commonNum = first.get('numerator') * second.get('numerator');
			var answer = new app.Model.Fraction({
				wholenumber:0,
				numerator: commonNum,
				denominator: commonDen,
			});
			return answer.simplify().toMixed();
		},

		div: function(fraction) {
			fraction = fraction.toImproper();
			fraction = new app.Model.Fraction({
				wholenumber:0,
				numerator: fraction.get('denominator'),
				denominator: fraction.get('numerator'),
			});
			return this.mult(fraction);
		},

	});

	/**
	 * SIMPLIFYING
	 *
	 */
	app.Model.SimplifyingExercize = Backbone.Model.extend({
		defaults: function() {
			return {
				question: {
					numerator: null,
					denominator: null
				},
				answer: {
					numerator: null,
					denominator: null
				},
				real: {
					numerator: null,
					denominator: null
				},
				result: null
			};
		},
		initialize: function() {
			var fraction = new app.Model.Fraction({ 
				options: {
					wholeRange: [1,10],
					numeratorRange: [1,10],
					denominatorRange: [2,10],
					type: 'mixed',
				}
			});
			fraction = fraction.simplify();
			this.set('answer', fraction.toJSON());
			var factor = fraction.randomInt([2,9]);
			fraction = fraction.rize(factor);
			this.set('question', fraction.toJSON());
		},
		checkAnswer: function() {
			if(this.get('answer').numerator == this.get("real").numerator && 
				this.get('answer').denominator == this.get("real").denominator ){
				this.set("result", true);
				return true;
			} else {
				this.set("result", false);
				return false;
			}
		}
    });

	app.Collection.SimplifyingExercizes = Backbone.Collection.extend({
		model: app.Model.SimplifyingExercize,

		checkAnswers: function() {
			var total = 0,
				rightAnswers = 0;
			
			_.each(this.models,function(model) {
				total++;
				if(model.checkAnswer()) {
					rightAnswers++;
				}
			}, this);
			return Math.floor(rightAnswers / total * 1000) / 10
		}
    });

	app.View.SimplifyingExercize = Backbone.View.extend ({
		tagName: 'div',

		template: _.template( $( '#simplifying-exercize-view' ).html()),

		initialize: function() {
			this.listenTo(this.model, 'change:result', this.changeColor);
		},

		events:{
            "change .numerator": "change",
			"change .denominator": "change",
        },

		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},

		change: function() {
			var num = this.$el.find(".numerator")[0].value;
			var den = this.$el.find(".denominator")[0].value;
			this.model.set("real",{numerator:Number(num), denominator:Number(den)});
		},

		changeColor: function() {
			var card = this.$el.find(".card-panel")[0];
			var color = this.model.get("result") == true ? "green" : "red";
			$(card).removeClass('blue-grey').addClass(color).addClass('darken-2');
		},

	});

	app.View.SimplifyingExercizeList = Backbone.View.extend({
		el: '#view',
		template: _.template( $( '#exercizes-view' ).html()),

		initialize: function() {
			this.render();
		},

		events:{
            "click .check": "check",
			"click .refresh": "refresh",
        },

		render: function() {
			this.$el.html(this.template({ models: this.collection.toJSON(), title:'Simplifying fractions' }));

			this.collection.each(function( item ) {
				this.renderExercize( item );
			}, this);
		},

		renderExercize: function ( item ) {
			var view = new app.View.SimplifyingExercize ({
				model: item
			});
			this.$el.append( view.render().el );
		},

		check: function() {
			var res = this.collection.checkAnswers();
			$("#result")[0].innerHTML = res + "%";
			$('#modal1').openModal();
		},

		refresh: function() {
			document.location.reload();
		}

	});

	/**
	 * MIXED
	 *
	 */
	app.Model.MixedExercize = Backbone.Model.extend({
		defaults: function() {
			return {
				question: {
					wholenumber: null,
					numerator: null,
					denominator: null
				},
				answer: {
					numerator: null,
					denominator: null
				},
				real: {
					numerator: null,
					denominator: null
				},
				result: null
			};
		},
		initialize: function() {
			var wholenumber = app.Utils.RandomInt(1,9);
			var numerator = app.Utils.RandomInt(1,9);
			var denominator = app.Utils.RandomInt(numerator+1,10);
			var answer = { numerator: numerator + denominator * wholenumber, denominator: denominator };
			var question = { wholenumber:wholenumber, numerator: numerator, denominator: denominator };
			this.set('answer', answer);
			this.set('question', question);
		},
		checkAnswer: function() {
			if(this.get('answer').numerator == this.get("real").numerator && 
				this.get('answer').denominator == this.get("real").denominator){
				this.set("result", true);
				return true;
			} else {
				this.set("result", false);
				return false;
			}
		}
    });

	app.Collection.MixedExercizes = Backbone.Collection.extend({
		model: app.Model.MixedExercize,

		checkAnswers: function() {
			var total = 0,
				rightAnswers = 0;
			
			_.each(this.models,function(model) {
				total++;
				if(model.checkAnswer()) {
					rightAnswers++;
				}
			}, this);
			return Math.floor(rightAnswers / total * 1000) / 10
		}
    });

	app.View.MixedExercize = Backbone.View.extend ({
		tagName: 'div',

		template: _.template( $( '#mixed-exercize-view' ).html()),

		initialize: function() {
			this.listenTo(this.model, 'change:result', this.changeColor);
		},

		events:{
            "change .numerator": "change",
			"change .denominator": "change",
        },

		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},

		change: function() {
			var num = this.$el.find(".numerator")[0].value;
			var den = this.$el.find(".denominator")[0].value;
			this.model.set("real",{ numerator:Number(num), denominator:Number(den) });
		},

		changeColor: function() {
			var card = this.$el.find(".card-panel")[0];
			var color = this.model.get("result") == true ? "green" : "red";
			$(card).removeClass('blue-grey').addClass(color).addClass('darken-2');
		},

	});

	app.View.MixedExercizeList = Backbone.View.extend({
		el: '#view',

		template: _.template( $( '#exercizes-view' ).html()),

		initialize: function() {
			this.render();
		},

		events:{
            "click .check": "check",
			"click .refresh": "refresh",
        },

		render: function() {
			this.$el.html(this.template({title: 'Transform mixed'}));

			this.collection.each(function( item ) {
				this.renderExercize( item );
			}, this);
		},

		renderExercize: function ( item ) {
			var view = new app.View.MixedExercize ({
				model: item
			});
			this.$el.append( view.render().el );
		},

		check: function() {
			var res = this.collection.checkAnswers();
			$("#result")[0].innerHTML = res + "%";
			$('#modal1').openModal();
		},

		refresh: function() {
			document.location.reload();
		}

	});

	/**
	 * IMPROPER
	 *
	 */
	app.Model.ImproperExercize = Backbone.Model.extend({
		defaults: function() {
			return {
				question: {
					numerator: null,
					denominator: null
				},
				answer: {
					wholenumber: null,
					numerator: null,
					denominator: null
				},
				real: {
					wholenumber: null,
					numerator: null,
					denominator: null
				},
				result: null
			};
		},
		initialize: function() {
			var wholenumber = app.Utils.RandomInt(1,10);
			var numerator = app.Utils.RandomInt(1,10);
			var denominator = app.Utils.RandomInt(2,10);
			while(denominator <= numerator) {
				denominator = app.Utils.RandomInt(2,10);
				numerator = app.Utils.RandomInt(1,10);
			}
			var answer = { wholenumber: wholenumber, numerator: numerator, denominator: denominator };
			var question = {  numerator: numerator + denominator * wholenumber, denominator: denominator };
			this.set('answer', answer);
			this.set('question', question);
		},
		checkAnswer: function() {
			if(this.get('answer').numerator == this.get("real").numerator && 
				this.get('answer').denominator == this.get("real").denominator &&
				this.get('answer').wholenumber == this.get("real").wholenumber ){
				this.set("result", true);
				return true;
			} else {
				this.set("result", false);
				return false;
			}
		}
    });

	app.Collection.ImproperExercizes = Backbone.Collection.extend({
		model: app.Model.ImproperExercize,

		checkAnswers: function() {
			var total = 0,
				rightAnswers = 0;
			
			_.each(this.models,function(model) {
				total++;
				if(model.checkAnswer()) {
					rightAnswers++;
				}
			}, this);
			return Math.floor(rightAnswers / total * 1000) / 10
		}
    });

	app.View.ImproperExercize = Backbone.View.extend ({
		tagName: 'div',

		template: _.template( $( '#improper-exercize-view' ).html()),

		initialize: function() {
			this.listenTo(this.model, 'change:result', this.changeColor);
		},

		events:{
            "change .numerator": "change",
			"change .denominator": "change",
			"change .wholenumber": "change",
        },

		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},

		change: function() {
			var num = this.$el.find(".numerator")[0].value;
			var den = this.$el.find(".denominator")[0].value;
			var whole = this.$el.find(".wholenumber")[0].value;
			this.model.set("real",{ wholenumber:Number(whole), numerator:Number(num), denominator:Number(den) });
		},

		changeColor: function() {
			var card = this.$el.find(".card-panel")[0];
			var color = this.model.get("result") == true ? "green" : "red";
			$(card).removeClass('blue-grey').addClass(color).addClass('darken-2');
		},

	});

	app.View.ImproperExercizeList = Backbone.View.extend({
		el: '#view',

		template: _.template( $( '#exercizes-view' ).html()),

		initialize: function() {
			this.render();
		},

		events:{
            "click .check": "check",
			"click .refresh": "refresh",
        },

		render: function() {
			this.$el.html(this.template({title: 'Transform improper'}));

			this.collection.each(function( item ) {
				this.renderExercize( item );
			}, this);
		},

		renderExercize: function ( item ) {
			var view = new app.View.ImproperExercize ({
				model: item
			});
			this.$el.append( view.render().el );
		},

		check: function() {
			var res = this.collection.checkAnswers();
			$("#result")[0].innerHTML = res + "%";
			$('#modal1').openModal();
		},

		refresh: function() {
			document.location.reload();
		}

	});

	/**
	 * FRACTIONS OF QUANTITY
	 *
	 */
	app.Model.QuantityExercize = Backbone.Model.extend({
		defaults: function() {
			return {
				question: {
					quantity: null,
					numerator: null,
					denominator: null
				},
				answer: {
					part: null
				},
				real: {
					part: null,
				},
				result: null
			};
		},
		initialize: function() {
			var numerator = app.Utils.RandomInt(1,12);
			var denominator = app.Utils.RandomInt(2,12);
			while(denominator <= numerator) {
				denominator = app.Utils.RandomInt(2,12);
				numerator = app.Utils.RandomInt(1,12);
			}
			var quantity = app.Utils.RandomInt(1,12) * denominator;
			var part = quantity * numerator / denominator;

			var answer = { part: part, denominator: denominator };
			var question = {  quantity: quantity, denominator: denominator, numerator: numerator };
			this.set('answer', answer);
			this.set('question', question);
		},
		checkAnswer: function() {
			if(this.get('answer').part == this.get("real").part ){
				this.set('result',true);
				return true;
			} else {
				this.set('result',false);
				return false;
			}
		}
    });

	app.Collection.QuantityExercizes = Backbone.Collection.extend({
		model: app.Model.QuantityExercize,

		checkAnswers: function() {
			var total = 0,
				rightAnswers = 0;
			
			_.each(this.models,function(model) {
				total++;
				if(model.checkAnswer()) {
					rightAnswers++;
				}
			}, this);
			return Math.floor(rightAnswers / total * 1000) / 10
		}
    });

	app.View.QuantityExercize = Backbone.View.extend ({
		tagName: 'div',

		template: _.template( $( '#quantity-exercize-view' ).html()),

		initialize: function() {
			this.listenTo(this.model, 'change:result', this.changeColor);
		},

		events:{
            "change .part": "change",
        },

		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},

		change: function() {
			var part = this.$el.find(".part")[0].value;
			this.model.set("real",{ part:Number(part) });
		},

		changeColor: function() {
			var card = this.$el.find(".card-panel")[0];
			var color = this.model.get("result") == true ? "green" : "red";
			$(card).removeClass('blue-grey').addClass(color).addClass('darken-2');
		},

	});

	app.View.QuantityExercizeList = Backbone.View.extend({
		el: '#view',

		template: _.template( $( '#exercizes-view' ).html()),

		initialize: function() {
			this.render();
		},

		events:{
            "click .check": "check",
			"click .refresh": "refresh",
        },

		render: function() {
			this.$el.html(this.template({title:'Fractions of quantity'}));

			this.collection.each(function( item ) {
				this.renderExercize( item );
			}, this);
		},

		renderExercize: function ( item ) {
			var view = new app.View.QuantityExercize ({
				model: item
			});
			this.$el.append( view.render().el );
		},

		check: function() {
			var res = this.collection.checkAnswers();
			$("#result")[0].innerHTML = res + "%";
			$('#modal1').openModal();
		},

		refresh: function() {
			document.location.reload();
		}

	});
	
	/**
	 * COMPARE FRACTIONS
	 *
	 */
	app.Model.CompareExercize = Backbone.Model.extend({
		defaults: function() {
			return {
				first: {
					numerator: null,
					denominator: null
				},
				second: {
					numerator: null,
					denominator: null
				},
				answer: {
					sign: null
				},
				real: {
					sign: null,
				},
				result: null
			};
		},
		initialize: function() {
			var numerator = app.Utils.RandomInt(1,10);
			var denominator = app.Utils.RandomInt(2,20);
			while(denominator == numerator) {
				denominator = app.Utils.RandomInt(2,20);
				numerator = app.Utils.RandomInt(1,10);
			}
			var first = {  denominator: denominator, numerator: numerator };
			this.set('first', first);
			numerator = app.Utils.RandomInt(1,10);
			denominator = app.Utils.RandomInt(2,20);
			while(denominator == numerator) {
				denominator = app.Utils.RandomInt(2,20);
				numerator = app.Utils.RandomInt(1,10);
			}
			var second = {  denominator: denominator, numerator: numerator };
			this.set('second', second);
			if((first.numerator / first.denominator) > (second.numerator / second.denominator)) {
				this.set('answer', { sign: ">" });
			} else if((first.numerator / first.denominator) < (second.numerator / second.denominator)) {
				this.set('answer', { sign: "<" });
			} else {
				this.set('answer', { sign: "=" });
			}
		},
		checkAnswer: function() {
			if(this.get('answer').sign === this.get("real").sign ){
				this.set("result", true);
				return true;
			} else {
				this.set("result", false);
				return false;
			}
		}
    });

	app.Collection.CompareExercizes = Backbone.Collection.extend({
		model: app.Model.CompareExercize,

		checkAnswers: function() {
			var total = 0,
				rightAnswers = 0;
			
			_.each(this.models,function(model) {
				total++;
				if(model.checkAnswer()) {
					rightAnswers++;
				}
			}, this);
			return Math.floor(rightAnswers / total * 1000) / 10
		}
    });

	app.View.CompareExercize = Backbone.View.extend ({
		tagName: 'div',

		template: _.template( $( '#compare-exercize-view' ).html()),

		initialize: function() {
			this.listenTo(this.model, 'change:result', this.changeColor);
		},

		events:{
            "change .sign": "change",
        },

		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},

		change: function() {
			var sign = this.$el.find(".sign")[0].value;
			this.model.set("real",{ sign:sign });
		},

		changeColor: function() {
			var card = this.$el.find(".card-panel")[0];
			var color = this.model.get("result") == true ? "green" : "red";
			$(card).removeClass('blue-grey').addClass(color).addClass('darken-2');
		},


	});

	app.View.CompareExercizeList = Backbone.View.extend({
		el: '#view',

		template: _.template( $( '#exercizes-view' ).html()),

		initialize: function() {
			this.render();
		},

		events:{
            "click .check": "check",
			"click .refresh": "refresh",
        },

		render: function() {
			this.$el.html(this.template({title:'Compare fractions'}));

			this.collection.each(function( item ) {
				this.renderExercize( item );
			}, this);
		},

		renderExercize: function ( item ) {
			var view = new app.View.CompareExercize ({
				model: item
			});
			this.$el.append( view.render().el );
		},

		check: function() {
			var res = this.collection.checkAnswers();
			$("#result")[0].innerHTML = res + "%";
			$('#modal1').openModal();
		},

		refresh: function() {
			document.location.reload();
		}

	});

	/**
	 * ADDING & SUBSTRACTION FRACTIONS
	 *
	 */
	app.Model.AddSubExercize = Backbone.Model.extend({
		defaults: function() {
			return {
				first: {
					wholenumber: null,
					numerator: null,
					denominator: null
				},
				second: {
					wholenumber: null,
					numerator: null,
					denominator: null
				},
				answer: {
					wholenumber: null,
					numerator: null,
					denominator: null
				},
				real: {
					wholenumber: null,
					numerator: null,
					denominator: null
				},
				sign: null,
				result: null
			};
		},
		initialize: function() {
			var first = new app.Model.Fraction({
				options:{
					wholeRange:[0,3],
					numeratorRange:[1,9],
					denominatorRange:[2,9],
				}
			});
			first = first.toMixed();
			var second = new app.Model.Fraction({
				options:{
					wholeRange:[0,3],
					numeratorRange:[1,9],
					denominatorRange:[2,9],
				}
			});
			second = second.toMixed();
			if(second.randomInt([1,10])<5){
				this.set('sign','-');
				//substracting
				if(first.compare(second) == ">") {
					answer = first.sub(second);
					this.set('first',first.toJSON());
					this.set('second',second.toJSON());
				} else {
					answer = second.sub(first);
					this.set('first',second.toJSON());
					this.set('second',first.toJSON());
				}
			} else {
				//adding
				this.set('sign','+');
				answer = first.add(second);
				this.set('first',first.toJSON());
				this.set('second',second.toJSON());
			}
			this.set('answer',answer.toJSON());
			//console.log(this.toJSON());
		},
		checkAnswer: function() {
			var answer = new app.Model.Fraction(this.get('answer'));
			var real = new app.Model.Fraction(this.get('real'));
			if(answer.equal(real)) {
				this.set("result", true);
				return true;
			} else {
				this.set("result", false);
				return false;
			}
		}
    });

	app.Collection.AddSubExercizes = Backbone.Collection.extend({
		model: app.Model.AddSubExercize,

		checkAnswers: function() {
			var total = 0,
				rightAnswers = 0;
			
			_.each(this.models,function(model) {
				total++;
				if(model.checkAnswer()) {
					rightAnswers++;
				}
			}, this);
			return Math.floor(rightAnswers / total * 1000) / 10
		}
    });

	app.View.AddSubExercize = Backbone.View.extend ({
		tagName: 'div',

		template: _.template( $( '#addsub-exercize-view' ).html()),

		initialize: function() {
			this.listenTo(this.model, 'change:result', this.changeColor);
		},

		events:{
            "change .wholenumber": "change",
			"change .numerator": "change",
			"change .denominator": "change",
        },

		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},

		change: function() {
			var whole = this.$el.find(".wholenumber")[0].value;
			var num = this.$el.find(".numerator")[0].value;
			var den = this.$el.find(".denominator")[0].value;
			this.model.set("real",{ wholenumber: Number(whole), numerator: Number(num), denominator: Number(den) });
		},

		changeColor: function() {
			var card = this.$el.find(".card-panel")[0];
			var color = this.model.get("result") == true ? "green" : "red";
			$(card).removeClass('blue-grey').addClass(color).addClass('darken-2');
		},


	});

	app.View.AddSubExercizeList = Backbone.View.extend({
		el: '#view',

		template: _.template( $( '#exercizes-view' ).html()),

		initialize: function() {
			this.render();
		},

		events:{
            "click .check": "check",
			"click .refresh": "refresh",
        },

		render: function() {
			this.$el.html(this.template({title:'Adding & Substracting fractions'}));

			this.collection.each(function( item ) {
				this.renderExercize( item );
			}, this);
		},

		renderExercize: function ( item ) {
			var view = new app.View.AddSubExercize ({
				model: item
			});
			this.$el.append( view.render().el );
		},

		check: function() {
			var res = this.collection.checkAnswers();
			$("#result")[0].innerHTML = res + "%";
			$('#modal1').openModal();
		},

		refresh: function() {
			document.location.reload();
		}

	});

	/**
	 * MULTIPLYING & DIVIDING FRACTIONS
	 *
	 */
	app.Model.MultDivExercize = Backbone.Model.extend({
		defaults: function() {
			return {
				first: {
					wholenumber: null,
					numerator: null,
					denominator: null
				},
				second: {
					wholenumber: null,
					numerator: null,
					denominator: null
				},
				answer: {
					wholenumber: null,
					numerator: null,
					denominator: null
				},
				real: {
					wholenumber: null,
					numerator: null,
					denominator: null
				},
				sign: null,
				result: null
			};
		},
		initialize: function() {
			var first = new app.Model.Fraction({
				options:{
					wholeRange:[0,2],
					numeratorRange:[1,9],
					denominatorRange:[2,9],
				}
			});
			first = first.toMixed();
			var second = new app.Model.Fraction({
				options:{
					wholeRange:[0,2],
					numeratorRange:[1,9],
					denominatorRange:[2,9],
				}
			});
			second = second.toMixed();
			if(second.randomInt([1,10])<5){
				this.set('sign','&#247;');
				//dividing
				answer = first.div(second);
			} else {
				//multiplying
				this.set('sign','x');
				answer = first.mult(second);
			}
			this.set('answer',answer.toJSON());
			this.set('first',first.toJSON());
			this.set('second',second.toJSON());
		},
		checkAnswer: function() {
			var answer = new app.Model.Fraction(this.get('answer'));
			var real = new app.Model.Fraction(this.get('real'));
			if(answer.equal(real)) {
				this.set("result", true);
				return true;
			} else {
				this.set("result", false);
				return false;
			}
		}
    });

	app.Collection.MultDivExercizes = Backbone.Collection.extend({
		model: app.Model.MultDivSubExercize,

		checkAnswers: function() {
			var total = 0,
				rightAnswers = 0;
			
			_.each(this.models,function(model) {
				total++;
				if(model.checkAnswer()) {
					rightAnswers++;
				}
			}, this);
			return Math.floor(rightAnswers / total * 1000) / 10
		}
    });

	app.View.MultDivExercize = Backbone.View.extend ({
		tagName: 'div',

		template: _.template( $( '#multdiv-exercize-view' ).html()),

		initialize: function() {
			this.listenTo(this.model, 'change:result', this.changeColor);
		},

		events:{
            "change .wholenumber": "change",
			"change .numerator": "change",
			"change .denominator": "change",
        },

		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},

		change: function() {
			var whole = this.$el.find(".wholenumber")[0].value;
			var num = this.$el.find(".numerator")[0].value;
			var den = this.$el.find(".denominator")[0].value;
			this.model.set("real",{ wholenumber: Number(whole), numerator: Number(num), denominator: Number(den) });
		},

		changeColor: function() {
			var card = this.$el.find(".card-panel")[0];
			var color = this.model.get("result") == true ? "green" : "red";
			$(card).removeClass('blue-grey').addClass(color).addClass('darken-2');
		},


	});

	app.View.MultDivExercizeList = Backbone.View.extend({
		el: '#view',

		template: _.template( $( '#exercizes-view' ).html()),

		initialize: function() {
			this.render();
		},

		events:{
            "click .check": "check",
			"click .refresh": "refresh",
        },

		render: function() {
			this.$el.html(this.template({title:'Multiplying & Dividing fractions'}));

			this.collection.each(function( item ) {
				this.renderExercize( item );
			}, this);
		},

		renderExercize: function ( item ) {
			var view = new app.View.MultDivExercize ({
				model: item
			});
			this.$el.append( view.render().el );
		},

		check: function() {
			var res = this.collection.checkAnswers();
			$("#result")[0].innerHTML = res + "%";
			$('#modal1').openModal();
		},

		refresh: function() {
			document.location.reload();
		}

	});

    // Router
    app.Router = Backbone.Router.extend({

		routes:{
			"": "index",
			"index": "index",
			"simplifying": "simplifying",
			"mixed": "mixed",
			"improper": "improper",
			"quantity": "quantity",
			"compare": "compare",
			"addsub": "addsub",
			"multdiv": "multdiv",
		},

		index: function() {
			var template = _.template($('#index-view').html());
			$('#view').html(template());
		},

		simplifying: function() {
			var exercizes = new app.Collection.SimplifyingExercizes();
			for(var i=1;i<=20;i++) {
				exercizes.add(new app.Model.SimplifyingExercize());
			}
			var view = new app.View.SimplifyingExercizeList({collection: exercizes});
		},

		mixed: function() {
			var exercizes = new app.Collection.MixedExercizes();
			for(var i=1;i<=20;i++) {
				exercizes.add(new app.Model.MixedExercize());
			}
			var view = new app.View.MixedExercizeList({collection: exercizes});
		},

		improper: function() {
			var exercizes = new app.Collection.ImproperExercizes();
			for(var i=1;i<=20;i++) {
				exercizes.add(new app.Model.ImproperExercize());
			}
			var view = new app.View.ImproperExercizeList({collection: exercizes});
		},

		quantity: function() {
			var exercizes = new app.Collection.QuantityExercizes();
			for(var i=1;i<=20;i++) {
				exercizes.add(new app.Model.QuantityExercize());
			}
			var view = new app.View.QuantityExercizeList({collection: exercizes});
		},

		compare: function() {
			var exercizes = new app.Collection.CompareExercizes();
			for(var i=1;i<=20;i++) {
				exercizes.add(new app.Model.CompareExercize());
			}
			var view = new app.View.CompareExercizeList({collection: exercizes});
		},

		addsub: function() {
			var exercizes = new app.Collection.AddSubExercizes();
			for(var i=1;i<=20;i++) {
				exercizes.add(new app.Model.AddSubExercize());
			}
			var view = new app.View.AddSubExercizeList({collection: exercizes});
		},

		multdiv: function() {
			var exercizes = new app.Collection.MultDivExercizes();
			for(var i=1;i<=20;i++) {
				exercizes.add(new app.Model.MultDivExercize());
			}
			var view = new app.View.MultDivExercizeList({collection: exercizes});
		},

    });
	
	var router = new app.Router();
	Backbone.history.start();
	
}(window));



