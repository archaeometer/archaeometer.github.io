/* Routines to manipulate BanyanDNA JSON files */
var calcName = [];
var timestamp = [];
var chi_square = [];
var roundChiSq = [];
var num_trials = [];
var calcType = [];
var dof = [];
var pvalue = [];
var odds = [];
var partOdds = [];
var includeBox = [];
var includedHyp = [];
var oddsCell = [];
var probCell = [];
var projRef;
var proj;
var projFileName;

// General functions

function getKeys(obj) {
	var keys = [];
		for (let key in obj) {
			keys[keys.length] = key; // gets the current key name
		}
	return(keys);
}

function findName(nodeId) {
	for (j=0;j<proj.nodes.length;j++){
		if (nodeId==proj.nodes[j].nodeId) {
			var name = proj.nodes[j].name;
			break;
		}
	}
	return(name);
}

// Statistics section functions

function updateOddsTable(partOdds) {
	var sumPartOdds = 0;
	var minPartOdds = Infinity;
	for (i=0; i<proj.calculations.length; i++){
		if (includedHyp[i]) {
			sumPartOdds += partOdds[i];
			minPartOdds = Math.min(minPartOdds,partOdds[i]);
		}
	}
	for (i=0; i<proj.calculations.length; i++){
		if (includedHyp[i]){
			var percentProb = (100*partOdds[i]/sumPartOdds).toFixed(2);
			var roundOdds = parseFloat((partOdds[i]/minPartOdds).toPrecision(3));
		} else {
			var percentProb = null;
			var roundOdds = null;
		};
		document.getElementById('oddsCell'+i).innerHTML = roundOdds;
		document.getElementById('probCell'+i).innerHTML = percentProb;
	}
}

function makeOddsTable(){
	document.getElementById('OddsTable').innerHTML = "<h2> Comparison of validation runs </h2>\n" +
		"<table><tbody>\n" + 
		"<tr> <th> </th> <th>" + calcName.join("</th> <th>") + "</th> </tr> \n" +
		"<tr> <th>Timestamp</th> <td>" + timestamp.join("</td> <td>") + "</td> </tr> \n" +
		"<tr> <th>Number of trials</th> <td>" + num_trials.join("</td> <td>") + "</td> </tr> \n" +
		"<tr> <th>Type</th> <td>" + calcType.join("</td> <td>") + "</td> </tr> \n" +
		"<tr> <th>Chi-square</th> <td>" + roundChiSq.join("</td> <td>") + "</td> </tr> \n" +
		"<tr> <th>Number of measurements</th> <td>" + dof.join("</td> <td>") + "</td> </tr> \n" +
		"<tr> <th>p-value</th> <td>" + pvalue.join("</td> <td>") + "</td> </tr> \n" +
		"<tr> <th>Include</th> <td>" + includeBox.join("</td> <td>") + "</td> </tr> \n" +
		"<tr> <th>Odds</th>" + oddsCell.join("") + " </tr> \n" + 
		"<tr> <th>Bayesian probability (%)</th>" + probCell.join("") + " </tr> \n" +
		"</tbody></table>\n";
	for (i=0; i<proj.calculations.length; i++){
		document.getElementById('includebox' + i).addEventListener('change', 
			function () {
				var hyp = parseInt(this.id.substring(10));
				includedHyp[hyp] = this.checked;
				updateOddsTable(partOdds);
			}
		)
	}
}

function displayScores(){
	var scoreData = [];
	for (j=0;j<proj.calculations.length;j++)
		scoreData[j] = proj.calculations[j].results.models[0].data;
	var scoreTable = "<h2> Scores for matches </h2>\n" +
		"<p> This table shows the match pairs included in the calculations with the amount of shared DNA in centiMorgans, the relationship(s) under each hypothesis, and the associated deviation from the mean of that relationship in standard deviations (&sigma;). Scores over 1 are highlighted in pink and those over 2 in red. For a correct hypothesis, roughly &frac13; should be over 1, 1 in 20 should be over 2, but only 3 in 1000 should be over 3.</p>" +
		"<table><tbody>\n" + 
		"<tr> <th> Person 1 </th> <th> Person 2 </th> <th> Shared cM</th> <th>" + 
		calcName.join("</th> <th>") + "</th> </tr> \n";
	if (scoreData.length>0){
		for (i=0;i<scoreData[0].length;i++){
			scoreTable += "<tr> <td>" + 
				scoreData[0][i].p1.split("@@")[0] + "</td> <td>" +
				scoreData[0][i].p2.split("@@")[0] + "</td> <td>" +
				scoreData[0][i].data_actual + "</td>"  ;
				for (j=0;j<proj.calculations.length;j++){
					var rels = [];
					for (k=0;k<scoreData[j][i].relationships.length;k++)
						rels[k] = scoreData[j][i].relationships[k].abbrev;
					var score = scoreData[j][i].tval;
					if (Math.abs(score) > 2) {
						var warnMarkupStart = '<span class="redwarning"><strong>';
						var warnMarkupEnd = '</strong></span>';
					} else if (Math.abs(score) > 1) {
						var warnMarkupStart = '<span class="amberwarning"><em>';
						var warnMarkupEnd = '</em></span>';
					} else {
						var warnMarkupStart = '';
						var warnMarkupEnd = '';
					} 
					scoreTable += '<td class="tdcentre">' + rels.join("+") + "<br> " + 
						warnMarkupStart + score.toFixed(2) + " &sigma;" + warnMarkupEnd + " </td>";
				}
			scoreTable += "</tr> \n";
		}
	}
	scoreTable += "</tbody></table>\n";
	document.getElementById('Scores').innerHTML = scoreTable;
}

function personDetails(nodeIds){
	var details = [];
	var result="";
	if (!Array.isArray(nodeIds)) var nodeIds = [nodeIds];
	for (k=0;k<nodeIds.length;k++){
		for (j=0;j<proj.nodes.length;j++){
		if (nodeIds[k]==proj.nodes[j].nodeId) {
				if (proj.nodes[j].sex=="Male")  
					sex = "&male;";
				else if (proj.nodes[j].sex=="Female")  
					sex = "&female;";
				else
					sex = "&#9893;";
				if (proj.nodes[j].birthYear==undefined) birth = ""; 
					else birth = ", b." + proj.nodes[j].birthYear;
				if (proj.nodes[j].deathYear==undefined) death = "";
					else death = ", d." + proj.nodes[j].deathYear;
				details[k] = proj.nodes[j].name + " (" + sex + birth + death +")";
				break;
			}
		}
	}
	return(details);
}

// JSON manipulation section functions

function displayManipulator(){
	var familyTable = "<h2> Manipulate JSON file </h2>\n" +
		"<h3> Bulk changes </h3>" +
		'<p> Delete calculations <input type="checkbox" id="deleteCalcs"> </p>' +
		'<p> Delete match data <input type="checkbox" id="deleteMatches"> </p>' +
		'<p> Anonymise <input type="checkbox" id="anonymise"> </p>' +
		"<h3> Change colours </h3>" +
		"<p> This table shows the families included in the file and allows their associated colours to be adjusted.</p>" +
		'<div id="coloursTable"></div>' +
		'<p> Change all families to this colour: ' + makeColourSelector("","All") + '</p>' +
		'<p> <button onclick="resetColours()">Reset colours</button> </p>' +
		"<h3> Download </h3>" +
		'<p> <button onclick="downloadProject()">Download modified project</button> </p>';
	document.getElementById('Manipulator').innerHTML = familyTable;
	displayColoursTable();
	// make listeners for bulk changes
	document.getElementById('deleteCalcs').addEventListener('change', 
		function () {
			if (this.checked) {
				proj.calculations = []; 
				displayScores();
				console.log("Calculations removed");
			}
			if (!this.checked) {
				proj.calculations = structuredClone(projRef.calculations);
				if (document.getElementById('anonymise').checked) anonNames();
				displayScores();
				console.log("Calculations reinstated");
			}
		}
	);
	document.getElementById('deleteMatches').addEventListener('change', 
		function () {
			if (this.checked) {
				proj.matchData = [];
				console.log("Match data removed");
			}
			if (!this.checked) {
				proj.matchData = structuredClone(projRef.matchData);
				console.log("Match data reinstated");
			}
		}
	);
	document.getElementById('anonymise').addEventListener('change', 
		function () {
			if (this.checked) {
				anonNames();
				displayColoursTable();
				displayScores();
				console.log("Anonymised");
			}
			if (!this.checked) {
				restoreNames();
				displayColoursTable();
				displayScores();
				console.log("Deanonymised");
			}
		}
	);

}

function displayColoursTable(){
	var coloursTableContent = "<table><tbody>\n" + 
		"<tr> <th> Parent 1 </th> <th> Parent 2 </th> <th> Children </th>" + 
		"<th> Colour </th> <th> Apply to descendants </th> <th> Apply to ancestors of parent 1 </th> <th> Apply to ancestors of parent 2 </th> </tr> \n";
	for (i=0;i<proj.families.length;i++){
		var parents = personDetails(getKeys(proj.families[i].parents));
		if (parents[1]==undefined) 
			var parentTwo = '</td> <td class="tdtop">';
		else
			var parentTwo = parents[1] +' </td> <td class="tdtop">';
		var colour = proj.families[i].color.split("-").at(-1).replace(")","");
		coloursTableContent += '<tr> <td class="tdtop">' + 
			parents[0] + ' </td> <td class="tdtop">' + parentTwo  +
			personDetails(getKeys(proj.families[i].children)).join('<br> ') + 
			' </td> <td class="tdcentretop">' + makeColourSelector(colour,i) +
			' </td> <td class="tdcentretop">' + '<input type="checkbox" id="desc' + i + '">' +
			' </td> <td class="tdcentretop">' + '<input type="checkbox" id="ancOne' + i + '">' +
			' </td> <td class="tdcentretop">' + '<input type="checkbox" id="ancTwo' + i + '">' +
			'</td> </tr> \n' ;
	}
	coloursTableContent += '</tbody></table>\n';
	document.getElementById('coloursTable').innerHTML = coloursTableContent;
	// make listeners for colour updates
	for (i=0;i<proj.families.length;i++){
		document.getElementById('colourSelector' + i).addEventListener('change', 
			function () {
				this.style.backgroundColor = this.value;
				var i = parseInt(this.id.substring(14));
				setColour(i, this.value);
				if (document.getElementById('desc' + i).checked){
					setColour(findDesc(i), this.value);
				}
				if (document.getElementById('ancOne' + i).checked){
					setColour(findAnc(i,1), this.value);
				}
				if (document.getElementById('ancTwo' + i).checked && 
					!(getKeys(proj.families[i].parents)[1]===undefined)){
					setColour(findAnc(i,2), this.value);
				}
			}
		);
	}
	document.getElementById('colourSelectorAll').addEventListener('change', 
		function () {
			this.style.backgroundColor = this.value;
			setColour(getKeys(proj.families), this.value);
		}
	);
}


function setColour(f, col){
	if (!Array.isArray(f)) var f = [f];
	for (i=0;i<f.length;i++){
		proj.families[f[i]].color = "var(--family-color-" + col + ")";
		document.getElementById('colourSelector' + f[i]).value = col;
		document.getElementById('colourSelector' + f[i]).style.backgroundColor = col;
	}
}

function findDesc(i){
// finds numbers of families descended from family i
	var descFamilies = [];
	var children = getKeys(proj.families[i].children);
	while(children.length>0){
		var newFamilyKeys = [];
		var newFamilies = [];
		// take next child from stack
		var nextChild = children.pop();
		// find families for which nextChild is a parent
		for (j=0;j<proj.nodes.length;j++){
			if (nextChild==proj.nodes[j].nodeId) {
				newFamilyKeys = getKeys(proj.nodes[j].familiesAsParent);
				break;
			}
		}
		// for each of those families
		for (j=0;j<newFamilyKeys.length;j++){
			// turn key into family number and save
			for (k=0;k<proj.families.length;k++){
				if (newFamilyKeys[j]==proj.families[k].id) {
					descFamilies.push(k);
					// find any children of new family and add to stack
					var newChildren = getKeys(proj.families[k].children);
					children = children.concat(newChildren);
					break;
				}
			}
		}
	}
	return(descFamilies);
}

function findAnc(i,n){
	var ancFamilies = [];
	var parents = [getKeys(proj.families[i].parents)[n-1]];
	while(parents.length>0){
		var newFamilyKey;
		var newFamilies = [];
		// take next parent from stack
		var nextParent = parents.pop();
		// find families for which nextParent is a parent
		for (j=0;j<proj.nodes.length;j++){
			if (nextParent==proj.nodes[j].nodeId) {
				newFamilyKey = proj.nodes[j].familyAsChild;
				break;
			}
		}
		// turn key into family number and save
		for (k=0;k<proj.families.length;k++){
			if (newFamilyKey==proj.families[k].id) {
				ancFamilies.push(k);
				// find any parents of new family and add to stack
				var newParents = getKeys(proj.families[k].parents);
				parents = parents.concat(newParents);
				break;
			}
		}
	}
	return(ancFamilies);
}

function makeColourSelector(col, i){
	var colourList = ["red", "orange", "yellow", "green", "cyan", "blue","purple", "pink"];
	var colourSelector = '<select id="colourSelector'+i+'" style="background-color: '+col+'">\n';
	for (const c of colourList) {
		if (c==col) 
			colourSelector += '<option value="' + c + '" style="background-color: ' +
				c + '" selected>' + c + '</option>';
		else 
			colourSelector += '<option value="' + c + '" style="background-color: ' + 
				c + '">' + c + '</option>';
	}
	colourSelector += '</select>\n';
	return(colourSelector);
}

function resetColours(){
	for (i=0;i<proj.families.length;i++){
		proj.families[i].color = structuredClone(projRef.families[i].color);
	}
	displayColoursTable();
	document.getElementById('colourSelectorAll').style.backgroundColor = '';
}

function anonNames(){
	var deletedCount = 0;
	var deletedIds =[];
	for (i=0;i<proj.nodes.length;i++){
		proj.nodes[i].name = "Person " + proj.nodes[i].nodeNumber;
	}
	for (i=0;i<proj.calculations.length;i++){
		var scoreData = proj.calculations[i].results.models[0].data;
		for (j=0;j<scoreData.length;j++){
			var p1NodeId = scoreData[j].p1.split("@@")[1];
			var p2NodeId = scoreData[j].p2.split("@@")[1];
			var p1Undefined = true;
			var p2Undefined = true;
			for (k=0;k<proj.nodes.length;k++){
				if (proj.nodes[k].nodeId==p1NodeId) {
					proj.calculations[i].results.models[0].data[j].p1 = 
						proj.nodes[k].name +"@@" + p1NodeId;
					p1Undefined = false;
				}
				if (proj.nodes[k].nodeId==p2NodeId) {
					proj.calculations[i].results.models[0].data[j].p2 = 
						proj.nodes[k].name +"@@" + p2NodeId;
					p2Undefined = false;
				}
			}
			if (p1Undefined) {
				for (k=0;k<deletedCount+1;k++){
					if (deletedIds[k] == p1NodeId) {
						proj.calculations[i].results.models[0].data[j].p1 = 
							"Deleted " + (k+1) +"@@" + p1NodeId;
					} else {
						deletedIds[deletedCount] = p1NodeId;
						deletedCount++;
						proj.calculations[i].results.models[0].data[j].p1 = 
							"Deleted " + deletedCount +"@@" + p1NodeId;
					}
				}
			}
			if (p2Undefined) {
				for (k=0;k<deletedCount+1;k++){
					if (deletedIds[k] == p2NodeId) {
						proj.calculations[i].results.models[0].data[j].p2 = 
							"Deleted " + (k+1) +"@@" + p2NodeId;
					} else {
						deletedIds[deletedCount] = p2NodeId;
						deletedCount++;
						proj.calculations[i].results.models[0].data[j].p2 = 
							"Deleted " + deletedCount +"@@" + p1NodeId;
					}
				}
			}
		}
	}
}

function restoreNames(){
	for (i=0;i<proj.nodes.length;i++){
		proj.nodes[i].name = structuredClone(projRef.nodes[i].name);
	}
	for (i=0;i<proj.calculations.length;i++){
		for (j=0;j<proj.calculations[i].results.models[0].data.length;j++){
			proj.calculations[i].results.models[0].data[j].p1 = 
				structuredClone(projRef.calculations[i].results.models[0].data[j].p1);
			proj.calculations[i].results.models[0].data[j].p2 = 
				structuredClone(projRef.calculations[i].results.models[0].data[j].p2);
		}
	}
}

function displayMatches(){
	var matchTable = "<h2> List of matches </h2>\n" +
		"<p> This table shows the match pairs included in the dataset, the DNA test comparison provider, and whether they are included in the calculations.</p>" +
		"<table><tbody>\n" + 
		"<tr> <th> Person 1 </th> <th> Person 2 </th> <th> Shared cM</th> <th> Provider </th> <th> Included </th> </tr> \n";
	for (i=0;i<proj.matchData.length;i++){
		matchTable += "<tr> <td>" + 
			findName(proj.matchData[i].personOneId)[0] + "</td> <td>" +
			findName(proj.matchData[i].personTwoId)[0] + "</td> <td>" +
			proj.matchData[i].sharedCm + "</td> <td>" +
			proj.matchData[i].dataProvider + "</td> <td>" +
			!proj.matchData[i].isIgnored + "</td> <td>" +
			"</td> </tr> \n";
	}
	matchTable += "</tbody></table>\n";
	document.getElementById('Matches').innerHTML = matchTable;
}



function downloadProject() {
    const json = JSON.stringify(proj); // Pretty-print with 2-space indentation

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = projFileName;    // Filename
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

document.getElementById('inputfile').addEventListener('change', function () {
	let fr = new FileReader();
	fr.onload = function () {
		projFileName = document.getElementById('inputfile').files[0].name;
		projRef = JSON.parse(fr.result);
		proj = JSON.parse(fr.result);
		for (i=0; i<proj.calculations.length; i++){
			calcName[i] = proj.calculations[i].name;
			timestamp[i] = proj.calculations[i].timestamp.substr(0,16).replace("T"," ");
			num_trials[i] = proj.calculations[i].results.models[0].num_trials;
			calcType[i] = proj.calculations[i].calcType;
			chi_square[i] = proj.calculations[i].results.models[0].chi_square;
			roundChiSq[i] = parseFloat(chi_square[i].toPrecision(4));
			dof[i] = proj.calculations[i].results.models[0].dof;
			pvalue[i] = proj.calculations[i].results.models[0].chi_square_probability.toFixed(3);
			partOdds[i] = Math.exp( 0.5 * (dof[i] - chi_square[i]) );
			oddsCell[i] = '<td id="oddsCell'+i+'"></td>';
			probCell[i] = '<td id="probCell'+i+'"></td>';
			includeBox[i] = '<input type="checkbox" id="includebox' + i + '" checked>';
			if (proj.calculations[i].calcType == "validation") includedHyp[i] = true;
		}
		makeOddsTable();
		updateOddsTable(partOdds);
//		displayMatches();
		displayScores();
		displayManipulator();
	}
	fr.readAsText(this.files[0]);
})
