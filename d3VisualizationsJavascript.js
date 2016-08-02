      //initializing variables 
      var econWorldBankData,maxElem,countryName;
      var countryAbbrevDictionary = countryAbbreviationDict(worldData);

      dropDownMenuCreator(); //create two select options at top of webpage
      display3DGlobe(worldData); //creates interactive globe 

      //economic indicator dictionary with specified information
      var economicIndicatorsDictionary  = {
        "Exports of goods and services (BoP, current US$)":
          {ind:"BX.GSR.GNFS.CD",
           detail:" Exports of goods and services comprise all transactions between residents of a country and the rest of the world involving a change of ownership from residents to nonresidents of general merchandise, net exports of goods under merchanting, nonmonetary gold, and services. Data are in current U.S. dollars."},
        "GNI (current US$)" :
          {ind:"NY.GNP.MKTP.CD",
           detail:"GNI (formerly GNP) is the sum of value added by all resident producers plus any product taxes (less subsidies) not included in the valuation of output plus net receipts of primary income (compensation of employees and property income) from abroad. Data are in current U.S. dollars."},
        "GDP (current US$)" :
          {ind:"NY.GDP.MKTP.CD",
           detail:"GDP at purchaser's prices is the sum of gross value added by all resident producers in the economy plus any product taxes and minus any subsidies not included in the value of the products. It is calculated without making deductions for depreciation of fabricated assets or for depletion and degradation of natural resources. Data are in current U.S. dollars. Dollar figures for GDP are converted from domestic currencies using single year official exchange rates. For a few countries where the official exchange rate does not reflect the rate effectively applied to actual foreign exchange transactions, an alternative conversion factor is used."},
        "Imports of goods and services (BoP, current US$)" :
          {ind:"BM.GSR.GNFS.CD",
           detail:" Imports of goods, services and primary income is the sum of goods imports, service imports and primary income payments. Data are in current U.S. dollars."},
        "GDP per capita (current US$)":
          {ind:"NY.GDP.PCAP.CD",
           detail:"GDP per capita is gross domestic product divided by midyear population. GDP is the sum of gross value added by all resident producers in the economy plus any product taxes and minus any subsidies not included in the value of the products. It is calculated without making deductions for depreciation of fabricated assets or for depletion and degradation of natural resources. Data are in current U.S. dollars."} 
      }

      //create a drop down menu for continents and economic indicators 
      function dropDownMenuCreator(){
        var continents = ["Pick a Continent:","Africa","Antarctica","Asia","Australia","Europe","North America","South America"];
        var econIndicators = ["Pick an economic indicator you are interested in:",
          "Exports of goods and services (BoP, current US$)",
          "GDP (current US$)","Imports of goods and services (BoP, current US$)",
          "GDP per capita (current US$)",
          "GNI (current US$)"];

        var divDropdown = d3.select("body")
                    .append("div")
                    .attr("id","body")

        var continentOptions = 
          divDropdown.append("div")
              .attr("id","continents")                  
              .append("select")
              .selectAll("option")
              .data(continents) 
            .enter()
              .append("option")
              .text(function (d){return d;});
        
        d3.select("#continents")
          .append("p")
          .text("(Note: You can also drag the globe to find a country you are interested.)")

        var econIndicatorsOptions = 
         divDropdown.append("div")               
            .append("select")
            .attr("id","economicIndicators")   
            .selectAll("option")
            .data(econIndicators) 
          .enter()
            .append("option")
            .attr("value",function (d){return d;})
            .text(function (d){return d;});
      }

      //create a dictionary with country names as keys and their 
      //abbreviations as values 
      function countryAbbreviationDict(worldMapData){
        var objArrWorldCountries = worldMapData.features;
        var abbreviationDict={};
        objArrWorldCountries.forEach(function(d){
             abbreviationDict[d.properties.name] = d.id
        });
        return abbreviationDict;
      }

      //finds the max value in an object
      function maxi(objArr){
        return (objArr.reduce(function(p,c){
          if (p.value>c.value)
            return p;
          else 
            return c;}));
      }

      //creates a 3D interactive display of the world 
      function display3DGlobe(worldDisplayData){

        var modal = document.getElementById('myModal');      

        var projection = 
          d3.geo.azimuthal()
          .scale(380)
          .origin([-71.03,42.37])
          .mode("orthographic")
          .translate([640, 400]);

        var circle = d3.geo.greatCircle()
          .origin(projection.origin());

        var origin = {
          "South America":[-58,-20], 
          "North America":[-100,37],
          "Africa":[15,3],
          "Europe":[20,45],
          "Asia":[70,45],
          "Antarctica":[-58,-95],
          "Australia":[130,-35]
        };

        var path = d3.geo.path()
          .projection(projection);

        var svg = d3.select("#body").append("svg:svg")
          .attr("id","worldGlobe")
          .attr("width", 1280)
          .attr("height", 700)
          .on("mousedown", mousedown);

        var feature = svg.selectAll("path")
            .data(worldDisplayData.features)
          .enter().append("svg:path")
            .attr("d", clip)
          .on("click",apiCall);

        window.addEventListener("click",function(event){
          if (event.target == modal) {
              modal.style.display = "none";
          }
        })

        feature.append("svg:title")
          .text(function(d){return d.properties.name;});

        d3.select(window)
          .on("mousemove", mousemove)
          .on("mouseup", mouseup); 

        d3.select("select").on("change", function() { 
          projection.origin(origin[this.value]);
          circle.origin(origin[this.value]);
          refresh();         
        });

        var m0,
            o0;

        function mousedown() {
          m0 = [d3.event.pageX, d3.event.pageY];
          o0 = projection.origin();
          d3.event.preventDefault();
        }

        function mousemove() {
          if (m0) {
            var m1 = [d3.event.pageX, d3.event.pageY],
                o1 = [o0[0] + (m0[0] - m1[0]) / 8, o0[1] + (m1[1] - m0[1]) / 8];
            projection.origin(o1);
            circle.origin(o1)
            refresh();
          }
        }

        function mouseup() {
          if (m0) {
            mousemove();
            m0 = null;
          }
        }

        function refresh(duration) {
          feature.attr("d", clip);
        }

        function clip(d) {
          return path(circle.clip(d));
        }
      }

      //creates interactive bar graph with data from World Bank API for selected 
      //economic indicator and country 
      function countryClick(){
        var selectEconOption = document.getElementById("economicIndicators");
        var econIndi = selectEconOption.options[selectEconOption.selectedIndex].value;

        var globalEconInfo = econWorldBankData;

        var newContent = "<p>"+ countryName +" - "+econIndi+"</p>"; 
        newContent += "<p>"+economicIndicatorsDictionary[econIndi].detail+"</p>"
        newContent += "<p>(Note: Press the left or right arrow key to see other years. Click outside the box to exit.)<p>"

        d3.select("#myModal").style("display","block").select(".modal-content").html(newContent);

        var margin = {top: 40, right:40, bottom: 10, left: 20},
          width = 500 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;
          barWidth = Math.floor(width/6);

        var x = d3.scale.linear()
          .range([barWidth / 2, width - barWidth / 2]);

        var y = d3.scale.linear()
          .range([height, 0]);

        var yAxis = d3.svg.axis()  
          .scale(y)
          .orient("right")
          .tickSize(-width) 
          .tickFormat(largeNumberName)  

        var svgB  = d3.select(".modal-content")
          .append("svg:svg")
            .attr("width",width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("svg:g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var years = svgB.append("svg:g")
          .attr("class", "years");

        var title = svgB.append("svg:text")
          .attr("class", "title")
          .attr("dy", ".71em")
          .text(2009);

        var year0 = d3.min(globalEconInfo, function(d) { return d.date; }),
          year1 = d3.max(globalEconInfo, function(d) { return d.date; }),
          yearM = year1; 

        x.domain([year1-3,year1]); 
        y.domain([0, d3.max(globalEconInfo, function(d) { return d.value; })+5000]);

        globalEconInfo = d3.nest()
          .key(function(e){return e.date;})
          .rollup(function(v) { return v.map(function(e) { return e.value; }); })
          .map(globalEconInfo);

        svgB.append("svg:g")
           .attr("class", "y axis")
           .attr("transform", "translate(" + width + ",0)")
           .call(yAxis)
         .selectAll("g")
         .filter(function(value) {return !value; }) 
           .classed("zero", true);

        var year = years.selectAll(".year")
          .data(d3.range(year0, year1 + 1)) 
           .enter().append("svg:g")
          .attr("class", "year")
              .attr("transform", function(year) { return "translate(" + x(year) + ",0)"; });

        year.selectAll("rect") 
            .data(function(year) { return globalEconInfo[year] || [0, 0]; })
          .enter().append("svg:rect")
            .attr("x", -barWidth / 2)
            .attr("width", barWidth)
            .attr("y", y)
              .attr("height", function(value) { return height - y(value); });

        year.append("svg:text")
          .attr("y", height - 4)
          .attr("id","yearDisplayed")
          .text(function(year) { 
            return year; 
          });

        d3.select(window).on("keydown", function() {
          switch (d3.event.keyCode) {
            case 37: yearM = Math.max(year0, yearM - 1); break;   
            case 39: yearM = Math.min(year1, yearM + 1); break;  
        }
        update();
        });

       //takes in a number and outputs a  shortened string representation 
       //ex: largeNumberName(1500000000) => 1.5B
        function largeNumberName(largeNum){
          var count = 0;
          while (largeNum >= 1000){
            largeNum = largeNum/ 1000;
            count ++;
          }
          //returns a numerical suffix for count defined above
          function numericalSuffix(num){
            var suffix = "";
            switch (num){
              case 1:
                suffix += "K";
                break;
              case 2:
                suffix += "M";
                break;
              case 3:
                suffix += "B"
                break;
              case 4:
                suffix += "T"
                break;
              case 5:
                suffix += "Q"
                break;
              default:
                suffix += "";
            }
            return suffix;
          }
          return largeNum + numericalSuffix(count);
        }

        function update() {
          if (!(yearM in globalEconInfo)) return;
          title.text(yearM);

        years.transition()
          .duration(750)
          .attr("transform", "translate(" + (x(year1) - x(yearM)) + ",0)");

        year.selectAll("rect")
         .data(function(year) { return globalEconInfo[year] || [0, 0]; })
          .transition()
            .duration(750)
          .attr("y", y)
          .attr("height", function(value) { return height - y(value); });};       
      } 

      //makes the api call 
      function apiCall(p){
        var head = document.head;
        var script = document.createElement('script');

        var selectEconOption = document.getElementById("economicIndicators");
        var econIndi = selectEconOption.options[selectEconOption.selectedIndex].value;

        script.setAttribute("src","https://api.worldbank.org/countries/"+countryAbbrevDictionary[p.properties.name]+"/indicators/"+economicIndicatorsDictionary[econIndi].ind+"?format=jsonP&prefix=mycallback");
        
        script.setAttribute("id","specificCountryData")
        head.appendChild(script);
        head.removeChild(script);
      }

      //pull data based on api call 
      function mycallback(data){
        var jString = JSON.stringify(data,null,4);
        var dataWork = JSON.parse(jString)[1];
        countryName = [dataWork[0].country.value];
        for(var k = 0; k < dataWork.length; k++){
        var elem = dataWork[k];
        delete elem.indicator;
        delete elem.decimal;
        elem.value  = Math.round(+elem.value);
        elem.date  = +elem.date;
        }
        econWorldBankData = dataWork.filter(function(a){ return a.value > 0;});
        maxElem = maxi(econWorldBankData).value;
        countryClick();
      }