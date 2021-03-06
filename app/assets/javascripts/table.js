$(document).ready(function(){
window.runTable = function(){
	$(".sidebar").sidebar('attach events','.ui.launch.button');

	$(".menu a").click(function(){
		var $this = $(this);
	   if ($this.hasClass("active")) {
	   	$this.removeClass("active");
	   	params.select[$this.data('table')].splice(params.select[$this.data('table')].indexOf($this.data('column')), 1)
	   } else {
	   	$this.addClass('active');
	   	if (params.select[$this.data('table')])
			params.select[$this.data('table')].push($this.data('column'))
	   	else
	   		params.select[$this.data('table')] = [$this.data('column')]
   	  }
   	});


	$(".header.item").click(function() {
		$(this).next('div').toggle("fast");
	});


	$("#export_csv_btn").on('click', function(event){
		$(this).attr('href', window.location.href + ".csv?" + $.param(params))
		console.log( window.location.href + ".csv?" + $.param(params));
	});


	var generateData = function(rows, columns){
		arr = [] 
		var titles = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
		for(i = 0; i < rows; i++){
			arr.push([]);
			for(j = 0; j < columns; j++){
				if(i==0){
					letter = titles[j%26]
					for(k=0; k < (j / 26); k++)
						letter += letter
					arr[i].push(letter)	
				
				} else
					arr[i].push(j)
			}
		}
		return arr;
	}


	
	// window.data = generateData(100, 100)

	var _translateToNames = function(row, col){
		return headers[0][col] + "" + row
	}

	var afterSelection = function(row, col){
		console.log("item selected: ", row, col)
		if (row > 0 && col < headers[0].length-1){
			$('.formula-builder').val($('.formula-builder').val() + " " +  _translateToNames(row,col))
			$('.formula-builder').focus();
		} 
	}

	var object_types = [] 


	var createTable = function(d){
		$('#table').remove();
		$('#table_container').append("<div id='table'>");
		headers = window.data.shift() || [];
		$('#table').handsontable({
			data: d, 
			rowHeaders: true,
			colHeaders: headers,
			contextMenu: true,
			stretchH: 'all',
			// width: 900,
			afterSelection: afterSelection,
			columnSorting: true,
			cells: function(){
				var cellProperties = {};
				cellProperties.readOnly = true;
				return cellProperties;
			}
		});
	}

	if (window.data && window.data.length > 0) {
		var data_cols = _.zip.apply(null, window.data);
  
	  var countData = function(data) {
	  	result = { };
			for(i = 0; i < data.length; ++i) {
			  if(!result[data[i]])
			  		result[data[i]] = 0;
			  ++result[data[i]];
			}
			return result
		}
	}

	var updateData = function(){
		console.log(params);
		$.get(window.location.href + "?" + $.param(params), function(response){
			window.data = response;
			createTable(window.data);
			$('#table').handsontable('render');
		});
	}

	window.startFilterContainer = function(){
		createDropDown("#filter-container .content", "table_name_dropdown", "Select Table", Object.keys(schema))

			$('.table_name_dropdown .menu').click(function(ev){
				$('.column_name_dropdown').remove();
				var table_name = $(ev.target).text();
				col_names = [] 
				for(i=0; i < schema[table_name].length; i++){
					col_names.push(table_name + "." + schema[table_name][i][0]);
				}
				createDropDown("#filter-container .content", "column_name_dropdown", "Select Column From " + table_name, col_names);
				$(".column_name_dropdown .menu").click(function(ev){
					var col_selected = ($(ev.target).attr("data-value"));
					var type = schema[table_name][col_selected][1];
					if(type == "datetime" || type == "integer" || type == "float"){
						insertFilterRow("num-date", $(ev.target).text(), "#filter-container .content");
					} else if (type == "string") {
						insertFilterRow("string", $(ev.target).text(), "#filter-container .content");
					} else if (type == "boolean") {
						insertFilterRow("boolean", $(ev.target).text(), "#filter-container .content");
					} else if (type == "dynamic")  
						insertFilterRow("dynamic", $(ev.target).text(), "#filter-container .content");
					$('.table_name_dropdown .text').text("Select Table");
					$('.column_name_dropdown').remove();
				});	
			});
	}

	// ************ POPULATE TABLE CODE *********** //  
	$(document).on("click", "#sidebar .button", function(){
		updateData()
	});


	// ************ CREATE DROPDOWNS FOR FILTER MODAL *********** // 
	// template needs drop name and starting value 
	// another method populates the menu items

	var getDropdown = function(class_name, starting){
		for(i = 0; i < window.headers.length; i++){
			_.templateSettings.variable = "temp";
			var template = _.template(
		  		$("script.ui-dropdown").html()
			);
			var templateData = {
				 dropdown_name: class_name,
		 		 starting_value: starting
			}
			return template(templateData);
		}
	}

	var insertColumnNamesIntoDropdown = function(dropdown_menu_selector, values){
		for(i = 0; i < values.length; i++){
			_.templateSettings.variable = "temp";
			var template = _.template(
		  		$("script.column-name-item").html()
			);
			var templateData = {
				 col_index: i,
		 		 col_name: values[i]
			}
			$(dropdown_menu_selector).prepend(
			    template(templateData)
			);
		}
	}	

	window.createDropDown = function(selector_to_append, dropdown_class_name, start, value_options){
		$(selector_to_append).append(
			getDropdown(dropdown_class_name, start)
		);
		insertColumnNamesIntoDropdown("." + dropdown_class_name + " .menu", value_options)
		$('.dropdown').dropdown();
		$('.' + dropdown_class_name + ' .text').text(start);
	}

	// insertColumnNamesIntoDropdown(".column_name_dropdown.filter.modal menu", )


	// ************ FILTER EVENT CssODE *********** // 

	$('.ui.modal').modal();


	window.insertFilterRow = function(row, name, selector){
		console.log("inserting filter row", row, name);
		_.templateSettings.variable = "temp";

		// Grab the HTML out of our template tag and pre-compile it.
		var template = _.template(
		  $("script.filter-row-" + row).html()
		);
		// Define our render data (to be put into the "rc" variable).
		var templateData = {
		  col_name: name
		}
		$(selector || ".filter.modal .content").prepend(
		    template(templateData)
		);
		$('.dropdown').dropdown();
	}



	// #############







	// #############

	// Filter Button pressed, Modal OPENS

	$('.button.filter').click(function(){
		if($('.table_name_dropdown').length == 0)
			window.startFilterContainer()
		$("#filter-container").toggle();
	});
	$("#filter-container").hide();
	// $('.button.filter').click(function(){
	// 	console.log("filter");
	// 	$('.ui.modal').modal("show");

	// 	if($('.table_name_dropdown').length == 0){
	// 		createDropDown(".filter.modal .content", "table_name_dropdown", "Select Table", Object.keys(schema))

	// 		$('.table_name_dropdown .menu').click(function(ev){
	// 			$('.column_name_dropdown').remove();
	// 			var table_name = $(ev.target).text();
	// 			col_names = [] 
	// 			for(i=0; i < schema[table_name].length; i++){
	// 				col_names.push(table_name + "." + schema[table_name][i][0]);
	// 			}
	// 			createDropDown(".filter.modal .content", "column_name_dropdown", "Select Column From " + table_name, col_names);
	// 			$(".column_name_dropdown .menu").click(function(ev){
	// 				var col_selected = ($(ev.target).attr("data-value"));
	// 				var type = schema[table_name][col_selected][1];
	// 				if(type == "datetime" || type == "integer" || type == "float"){
	// 					insertFilterRow("num-date", $(ev.target).text());
	// 				} else if (type == "string") {
	// 					insertFilterRow("string", $(ev.target).text());
	// 				} else if (type == "boolean") {
	// 					insertFilterRow("boolean", $(ev.target).text());
	// 				} else if (type == "dynamic")  
	// 					insertFilterRow("dynamic", $(ev.target).text());
	// 				$('.table_name_dropdown .text').text("Select Table");
	// 			});	
	// 		});
	// 	}
	// });

	if(!String.prototype.trim) {  
	  String.prototype.trim = function () {  
	    return this.replace(/^\s+|\s+$/g,'');  
	  };  
	} 

	var updateParamsFilter = function(ev){
		params.filter = {}
		var names = $('#filter-container .content .filter-criteria .name')
		var c = $('#filter-container .content .filter-criteria input[name="Criteria"]').toArray()
		var criterion = []
		for(i = 0; i < c.length; i ++){
			criterion.push($(c[i]).attr("value"));
		}

		var values = $('#filter-container .content .filter-criteria input.value');


		for(i=0; i < names.length; i ++){
			var table_name = $(names[i]).text().split(".")[0].trim();
			if(params.filter[table_name])
				params.filter[table_name].push([$(names[i]).text().split(".")[1].trim(), criterion[i], $(values[i]).val()])
			else
				params.filter[table_name] = [[$(names[i]).text().split(".")[1].trim(), criterion[i], $(values[i]).val()]]
		}

	}

	// Filter Modal Submitted
	$('#filter-submit').click(function(ev){
		console.log("modal-submitted");
		updateParamsFilter(ev);
		updateData();
	});
	$(".header.item").first().click()

	$('.ui.button.reset').click(function(){
		window.location.replace("http://localhost:3000");
	})


	window.setTimeout(function(){
		$(".ui.right.floated.black.launch.button").click()
	}, 100);
}();
});