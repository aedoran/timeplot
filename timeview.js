(function(){
var timeplot = {
	
	conf:{},
	plotMe:[],
	axes:[],
	init:function(conf) {
		this.conf = conf
		return this;
	},
	getOptionsForData:function(d) {
		options = [];
		kind = -1;		
		if (isNaN(d.data[0].v)) {
			kind = 1;
		} else {
			kind = 0;
		}
		var isBinary = true;
		var hasBlockData = false;
		d.data.filter(function (v) {
			if (v.v!=0 && v.v!=1) {
				isBinary = false;
			}
			if ("a" in v) {
				hasBlockData = true;
			} 
		});

		if (kind == 0) {
			options.push("line");
		}
		if (isBinary) {
			options.push("block");
			if (hasBlockData) {
				//options.push("block with values");
			}
		}
		if (kind == 1) {
			options.push("event");
		}

		//options.push("tooltip");
		return options;
	},
	createRow:function(d) {
		var row = document.createElement('tr');
		var name_col = document.createElement('td');
		var check_col = document.createElement('td');
		var display_col = document.createElement('td')
		var checkbox = document.createElement('input');
		var select = document.createElement('select');

		name_col.innerHTML = d.label;
		checkbox.id = d.label+'_checkbox';
		checkbox.type = 'checkbox';
		select.id = d.label+'_display';
		for (b in this.getOptionsForData(d)) {
			var o = document.createElement('option');
			o.value = options[b];
			o.innerHTML = options[b];
			select.appendChild(o);
		}
		display_col.appendChild(select);
		check_col.appendChild(checkbox);
		row.appendChild(name_col);
		row.appendChild(check_col);
		row.appendChild(display_col);
		return row;
	},
	createInputForm:function() {
		//check if conf data is ok
		ok = false;
		if ("data" in this.conf && "inputParent" in this.conf ) {
			if (this.conf.data.length > 0) {
				ok = true;
			}
		}
		if (ok) {
			t = document.createElement('table');
			for (a in this.conf.data) {
				row = this.createRow(this.conf.data[a]);
				t.appendChild(row);
			}
			b = document.createElement('input');
			b.type = "button"
			b.value = "plot";
			b.onclick = function() {
				window.timeplot.plotMe = [];
				for (a in window.timeplot.conf.data) {
					v = window.timeplot.conf.data[a];
					if (document.getElementById(v.label+"_checkbox").checked == true) {
						v.type = $('#'+v.label+'_display').val();
						window.timeplot.plotMe.push(v);
					}
				}
				window.timeplot.plot();
			}
			this.conf.inputParent.append(t);
			this.conf.inputParent.append(b);
		}
		return this;
	},
	convertDataToFlot:function(data) {
	    var d = [];
	    for (var a in data) {

	      time = new Date(data[a].t);
		  if (isNaN(data[a].v)) {
			d.push([time,1]);
		  } else {
			d.push([time,data[a].v]);      		
		  }

	    }    
	    return d;
	},
	addAxis:function(data) {
			c = this.axes.length;
			switch (data.type) {
				case "block":
					this.axes.push({min:0,max:1});
					break;
				case "event":
					this.axes.push({min:0,max:1});
					break;					
				case "line":
					this.axes.push({});
					break;
			}
			return c+1;		
	},
	plot:function() {
		//use plotMe if it is set, otherwise plot everything
		this.axes = [];
		var dataPlots = [];
		var blockcount = 0;
		var blockIndexes = [];
		var annotationscount = [];
		var annotations = [];
		var plots = this.conf.data;

		if (this.plotMe.length > 0) {
			plots = this.plotMe;
		}
		for (a in plots) {
			var i = plots[a];
			fdata = this.convertDataToFlot(i.data);
			axisIndex = this.addAxis(i);
			switch (i.type) {
				case "line":
					dataPlots.push({
						"label":i.label,
						data:fdata,					
						lines:{show:true},
						yaxis:axisIndex
						});
					break;
				case "block":
					blockcount = blockcount+1;
					blockIndexes.push(axisIndex);
					dataPlots.push({
						"label":i.label,
						data:fdata,
						lines:{show:true,steps:true,fill:true},
						yaxis:axisIndex
						});
					break;
				case "event":
					label = i.label;
					annotationscount = annotationscount+1;
					annotations.push({item:i,yaxis:axisIndex,itemIndex:a});
					dataPlots.push({"label":label,data:fdata,lines:{show:false},points:{show:true},yaxis:axisIndex});
					break;				
			}
			
		}
		
		//shift the yaxis for block data so that they line up vertically
		currentblock = 0;
		for (a in blockIndexes) {
			b = blockIndexes[a] -1;
			this.axes[b].min=0-currentblock;
			this.axes[b].max=blockcount-currentblock;
			this.axes[b].show=false;
			currentblock = currentblock+1;
		}		
		currentanno = 0;
		for (a in annotations) {			
			b = annotations[a].yaxis-1;	
			this.axes[b].min=0-currentanno;
			this.axes[b].max=annotationscount-currentanno;
			this.axes[b].show=false;
			currentanno = currentanno+1;
		}		
		var p = $.plot(this.conf.plotDiv, dataPlots,{yaxes:this.axes,xaxis:{mode:'time'}});
		
		for (a in annotations) {
			d = annotations[a].item;
			yaxis=annotations[a].yaxis;
			for (b in d.data) {
				i = d.data[b];
				_date = new Date(i.t);
				var o;
				o = p.pointOffset({x:_date.getTime(),y:1,yaxis:yaxis});
				series = p.getData();	
				this.conf.plotDiv.append('<div style="position:absolute;left:' + (o.left + 4) + 'px;top:' + o.top + 'px;color:'+series[annotations[a].itemIndex].color+';">'+i.v+'</div>');
			}
		}
		
		
		
		return this;
	}


}


if(!window.timeplot){window.timeplot=timeplot;}	
	
})();