
const reLink = /[^;}{]*(?:->[^;}{]*)+;/g;

function grabDOT(code){
	let matches = code.match(reLink);
	let result = [];
	
	if(matches){
		matches.forEach((str)=>{
			str = str.replace(/;$/,'');
			str = str.replace(/\[[^\]\[]*\]/g, '');
			str = str.replace(/\/\*[^\/]+\*\//g, '');
			str = str.replace(/\/\/.*/g, '');
			
			let part = str.split('->');
			
			part = part.map(a=>{
				a = a.trim();
				try{
					return JSON.parse(a);
				}
				catch(e){
					return a;
				}
			});
			
			for(let i=1; i<part.length; ++i){
				result.push({from:part[i-1], to:part[i]});
			}
		});
	}
	
	return result;
}

module.exports = grabDOT;