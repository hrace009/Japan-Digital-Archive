(function(Browser) {
    Browser.Items = Browser.Items ||{};
    Browser.Items.Collection = Backbone.Collection.extend({

        model:Browser.Items.Model,
        base : jda.app.apiLocation + 'api/items/search?',
        search : {  page:1
                },

        url : function()
        {
            //constructs the search URL
            var url = this.base;
            console.log(this.search);
            if( !_.isUndefined(this.search.q) && this.search.q.length > 0) url += '&q=' + this.search.q.toString();
            if( !_.isUndefined(this.search.nq) ) url += '&nq=' + this.search.nq;
            if( !_.isUndefined(this.search.tags) && this.search.tags.length > 0) url += '&tags=' + this.search.tags.toString();
            if( !_.isUndefined(this.search.viewType) ) url += '&view_type=' + this.search.viewType;
            if( !_.isUndefined(this.search.media_type) && this.search.media_type !== "") url += '&type=' + this.search.media_type;
            if( !_.isUndefined(this.search.sort) ) url += '&sort=' + this.search.sort;
            if( !_.isUndefined(this.search.itemId) && this.search.itemId > 0) url += '&collection=' + this.search.itemId;
            if( !_.isUndefined(this.search.page) ) url += '&page=' + this.search.page;
            if( !_.isUndefined(this.search.published) ) url += '&published=' + this.search.published;
            if( !_.isUndefined(this.search.data_source) ) url += '&data_source=' + this.search.data_source;
            if( !_.isUndefined(this.search.times)&&!_.isNull(this.search.times) ){
                if( !_.isUndefined(this.search.times.start) ) url += '&media_since=' + this.search.times.start;
                if( !_.isUndefined(this.search.times.end) ) url += '&media_before=' + this.search.times.end;
            }
            if( !_.isUndefined(this.search.media_before) ) url += '&media_before=' + this.search.media_before;
            if( !_.isUndefined(this.search.media_after) ) url += '&media_after=' + this.search.media_after;
            if( !_.isUndefined(this.search.user) && this.search.user>=-1&& this.search.user!=="") url += '&user=' + this.search.user;
            if(jda.app.currentView=='event') url+='&geo_located=1';
            console.log(url);
            return url;
        },

        setSearch : function(obj, reset)
        {
            if(reset){
                this.search = { page:1, published:1 };
                if(_.isNumber(obj.collection)||_.isNumber(obj.user)) {
                    this.search.media_type="-Collection";
                }
                if(_.isNumber(obj.user)) {
                    this.search.media_type="Collection";
                    this.search.data_source="db";
                }
                if(!_.isUndefined(obj.itemId) || jda.app.currentView=='event') {
                    this.search.published=undefined;
                }
                if(!_.isUndefined(obj.itemId) && _.isUndefined(obj.q)) {
                    this.search.data_source="db";
                }
            }

            _.extend(this.search,obj);
            if(jda.app.currentView=="event") console.log("Range slider values",$("#range-slider").slider( "option", "values" ));
        },

        getSearch : function()
        {
            return this.search;
        },

        parse : function(response)
        {

            this.tags=response.tags;
            this.count = response.items_count;
            return response.items;
        }
    });



    Browser.Items.MapCollection = Backbone.Collection.extend({

	model:Browser.Items.Model,
	base : sessionStorage.getItem("geoServerUrl"),
	initialize : function(models,options){
	    console.log("in MapCollection.initialize");
	    this.latitude = options.mouseLatitude;
	    this.longitude = options.mouseLongitude;
            _.extend(this,options);

	},
        url : function()
	{
	    console.log("in MapCollection.url");
            return "http://dev.jdarchive.org:8983/solr/jda/select?wt=json";
	    //return this.base+'getFeatureInfo&SQL='+this.SQL;

        },

	fetch : function(options) {
	    console.log("in MapCollection.fetch");
	    _this = this;
	    // use EventMap functions that convert UI widgets to components of Solr query
	    var mediaFilter = jda.app.eventMap.getMediaFilter();
	    var timeFilter = jda.app.eventMap.getTimeFilter();
	    var searchQuery = jda.app.eventMap.getSearchQuery();
	    console.log("  with", mediaFilter, timeFilter, searchQuery);
	    solrUrl = "http://dev.jdarchive.org:8983/solr/jda/select?" + "fq=" + mediaFilter + "&fq=" + timeFilter;
	    //solrUrl = "http://dev.jdarchive.org:8983/solr/jda/select";
	    pt = this.latitude + ',' + this.longitude;
	    jQuery.ajax({
		url: solrUrl,
		dataType: 'JSONP',
		data: {
		    q: searchQuery,
		    rows: 50,
		    wt: 'json',
		    fq: '{!geofilt}',
		    sfield: 'bbox_rpt',
		    d: 10,
		    pt: pt,
		    sort: "geodist() asc"
		    //fq: "bbox_rpt"  + this._mapViewToEnvelope(this.map)
		},
		jsonp: 'json.wrf',
		success: function(data) {
		    solrResponse = data;
		    console.log("in MapCollection.fetch, solr response received");
		    solrItems = data.response.docs;
		    first = solrItems[0];
		    browser = jda.module("browser");
		    model = new browser.Items.Model(first);
		    _this.reset();  // remove items
		    _.each(solrItems, function(element, index, list){this.add(element);}, _this);
		    success = options.success;
		    success(data.response.docs, _this);
		},
		error: function(arg) {
		    console.log("in MapCollection.fetch, error!!");
		    error = options.error;
		    error(arg, arg, arg);
		}
	    });

	},

        parse : function(response)
        {
	    console.log("in MapCollection.parse")
	    r = response;
		
	    return response.response.docs;
/*
            if(!_.isNull(response)){
                return response.results.splice(0,Math.max(response.results.length,50));
            }
            else{
                return [];
            }
*/
        }
    });


    Browser.Router = Backbone.Router.extend({ /* ... */ });


})(jda.module("browser"));
