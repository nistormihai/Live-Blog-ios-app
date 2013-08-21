$(function() {



  window.blogsCollection = Backbone.Collection.extend({
    model: BlogItemModel,
    url: function() {

      return 'http://'+app.session.get("host")+'/resources/HR/User/'+app.session.get("userId")+'/Blog/Live.json?X-Filter=Id,Title, Description';
    },
    parse: function(response) {

      return response.BlogList;
    }
  });


  window.entriesCollection = Backbone.Collection.extend({
    model: EntryItemModel,
    limit: 10,
    maxCid:0,
    minCid: false,
    loadDirection: "init",
    listEnd:false,


    url: function() {
      if (this.loadDirection=="new"){

        console.log('http://'+app.session.get("host")+'/resources/LiveDesk/Blog/'+app.session.get("blog")+'/Post/Published.json?cId.since='+this.maxCid+'&asc=order&x-filter=*');
        return 'http://'+app.session.get("host")+'/resources/LiveDesk/Blog/'+app.session.get("blog")+'/Post/Published.json?cId.since='+this.maxCid+'&asc=order&x-filter=*';

      } else if (this.loadDirection=="more"){

        console.log('http://'+app.session.get("host")+'/resources/LiveDesk/Blog/'+app.session.get("blog")+'/Post/Published.json?limit='+this.limit+'&cId.until='+this.minCid+'&x-filter=*');
        return 'http://'+app.session.get("host")+'/resources/LiveDesk/Blog/'+app.session.get("blog")+'/Post/Published.json?limit='+this.limit+'&cId.until='+this.minCid+'&x-filter=*';


      } else{

        console.log('http://'+app.session.get("host")+'/resources/LiveDesk/Blog/'+app.session.get("blog")+'/Post/Published.json?limit='+this.limit+'&x-filter=*');
        return 'http://'+app.session.get("host")+'/resources/LiveDesk/Blog/'+app.session.get("blog")+'/Post/Published.json?limit='+this.limit+'&x-filter=*';


      }
    },
    parse: function(response) {
      console.log('parsing entriesList ...');

      return response.PostList;


    },




    /**
      * updates CIds after collection.fetch. Fired manually.
      */
      updateCids: function() {
        var pluckedCids = this.pluck('CId');
        pluckedCids = _.map(pluckedCids, function(num){ return parseInt(num); });

        var max =  parseInt(_.max(pluckedCids));
        if (max > this.maxCid) this.maxCid = max;

        if (!this.minCid){
          this.minCid = parseInt(_.min(pluckedCids));
        } else{
          var min =  parseInt(_.min(pluckedCids));

          if ( min < this.minCid ) this.minCid = min;
          if( isNaN(min) ) this.listEnd = true;

        }

        console.log(this.minCid+"  "+this.maxCid);
      }

    });

});

