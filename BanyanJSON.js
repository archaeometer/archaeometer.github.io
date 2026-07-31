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

function getKeys(obj) {
	var keys = [];
		for (let key in obj) {
			keys[keys.length] = key; // gets the current key name
		}
	return(keys);
}

function updateOddsTable(partOdds) {
	var sumPartOdds = 0;
	var minPartOdds = Infinity;
	var roundOdds;
	var percentProb;
	for (i=0; i<proj.calculations.length; i++){
		if (includedHyp[i]) {
			sumPartOdds = sumPartOdds + partOdds[i];
			minPartOdds = Math.min(minPartOdds,partOdds[i]);
		}
	}
	for (i=0; i<proj.calculations.length; i++){
		if (includedHyp[i]){
			percentProb = (100*partOdds[i]/sumPartOdds).toFixed(2);
			roundOdds = parseFloat((partOdds[i]/minPartOdds).toPrecision(3));
		} else {
			percentProb = null;
			roundOdds = null;
		};
		document.getElementById('oddsCell'+i).innerHTML = roundOdds;
		document.getElementById('probCell'+i).innerHTML = percentProb;
	}
}

function makeOddsTable(){
	document.getElementById('OddsTable').innerHTML = "<h2> Comparison of Hypotheses </h2>\n" +
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
			document.getElementById('includebox' + i)
				.addEventListener('change', function () {
				var hyp = parseInt(this.id.substring(10));
				includedHyp[hyp] = this.checked;
				updateOddsTable(partOdds);
			})
	}
}

function displayMatches(){
	var matchTable = "<h2> List of matches </h2>\n" +
		"<p> This table shows the match pairs included in the dataset, the DNA test comparison provider, and whether they are included in the calculations.</p>" +
		"<table><tbody>\n" + 
		"<tr> <th> Person 1 </th> <th> Person 2 </th> <th> Shared cM</th> <th> Provider </th> <th> Included </th> </tr> \n"
	for (i=0;i<proj.matchData.length;i++){
		for (j=0;j<proj.nodes.length;j++){
			if (proj.matchData[i].personOneId==proj.nodes[j].nodeId) 
				nameOne = proj.nodes[j].name;
			if (proj.matchData[i].personTwoId==proj.nodes[j].nodeId) 
				nameTwo = proj.nodes[j].name;
		}
		matchTable += "<tr> <td>" + 
			nameOne + "</td> <td>" +
			nameTwo + "</td> <td>" +
			proj.matchData[i].sharedCm + "</td> <td>" +
			proj.matchData[i].dataProvider + "</td> <td>" +
			!proj.matchData[i].isIgnored + "</td> <td>" +
			"</td> </tr> \n"
	}
	matchTable += "</tbody></table>\n";
	document.getElementById('Matches').innerHTML = matchTable;

}

function displayScores(){
	var scoreData = [];
	for (j=-0;j<proj.calculations.length;j++)
		scoreData[j] = proj.calculations[j].results.models[0].data;
	var scoreTable = "<h2> Scores for matches </h2>\n" +
		"<p> This table shows the match pairs included in the calculations with the amount of shared DNA in centiMorgans, the relationship(s) under each hypothesis, and the associated deviation from the mean of that relationship in standard deviations (&sigma;). Scores over 1 are highlighted in pink and those over 2 in red.</p>" +
		"<table><tbody>\n" + 
		"<tr> <th> Person 1 </th> <th> Person 2 </th> <th> Shared cM</th> <th>" + 
		calcName.join("</th> <th>") + "</th> </tr> \n";
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
					var warnClass = 'class="redwarning"';
				} else if (Math.abs(score) > 1) {
					var warnClass = 'class="amberwarning"';
				} else {
					var warnClass = "";
				} 
				scoreTable += '<td class="tdcentre">' + rels.join("+") + "<br> " + 
					"<span "+ warnClass +">" + score.toFixed(2) + " &sigma;</span> </td>";
			}
		scoreTable += "</tr> \n";
	}
	scoreTable += "</tbody></table>\n";
	document.getElementById('Scores').innerHTML = scoreTable;

}

document.getElementById('inputfile').addEventListener('change', function () {
	let fr = new FileReader();
	fr.onload = function () {
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
			includeBox[i] = '<input type="checkbox" id="includebox' + i + '" checked="true">';
			includedHyp[i] = true;
		}
		makeOddsTable();
		updateOddsTable(partOdds);
		displayMatches();
		displayScores();
	}
	fr.readAsText(this.files[0]);
})
