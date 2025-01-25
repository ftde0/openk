var SortableList = new Class({

  initialize : function(){
    this.all_elements_count=null;
    this.list_ordered_by=new Array();
    this.is_sorted_by=null;
  },

  make_sortword : function(i, ordering_idx) {
    return '';
  },

  make_sorted : function (by_what,force){
    if(!force && this.is_sorted_by==by_what){
      return;
    }
    this.is_sorted_by=by_what;
    if(by_what&&!this.list_ordered_by[by_what]){
      this.cache_sorted(by_what);
    }
  },

  cache_sorted : function(ordering_idx){
    var ordered = new Array();
    for(var i=0;i< this.all_elements_count ; ++i){
      ordered.push(i);
    }
    var sorting_keys= new Array();
    for(var i=0;i< this.all_elements_count ; ++i){
      sorting_keys.push(this.make_sortword(i,ordering_idx));
    }
    var all_numeric=true;
    for(var i=0;i<sorting_keys.length; ++i){
      if(sorting_keys[i]+0!=sorting_keys[i]){
        all_numeric=false;
        break;
      }
    }
    if(all_numeric){
      ordered.sort(function (a,b){return (sorting_keys[a]-sorting_keys[b]);});
    }else{
      ordered.sort(function (a,b){return (sorting_keys[a].localeCompare(sorting_keys[b]));});
    }

    this.list_ordered_by[ordering_idx]=ordered;
  },

  setAllElementsCount : function(elements_count){
    this.all_elements_count=elements_count;
    this.list_ordered_by=new Array();
  }

});
