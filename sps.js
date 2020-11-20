
/* 
Сложная позиционная система
*/

function sps(base, sep, pad, post){
	if(typeof base === 'string'){
		({base, sep, pad, post} = decoding(base));
	}
	//const revSeps = sep.slice(0).reverse();
	post = post || '';
	let pat = sep.reduceRight((akk, s)=>{
		return `(?:${akk}${s})?(\\d+)`;
	}, '(\\d+)') + post;
	
	let re = new RegExp('^'+pat + '$');
	
	sep[-1] = '';
	base[-1] = 1;
	function parse(code){
		let items = code.match(re);
		if(!items) throw new Error('Incorrect code ' + code);
		
		items.shift();
		
		items.reverse();
		
		//console.log(items);
		let value = 0, b = 1;;
		for(let i=0; i<items.length; ++i){
			b *= base[i-1];
			let part = (+items[i]) || 0;
			
			//console.log(part, b);
			value += part*b;
			
		}
		
		return value;
	}
	
	function is(code){
		return re.test(code);
	}
	
	function stringify(value, prev){
		if(prev){
			value = Math.round(value);
		}
		
		let res = '';
		
		for(let i=0; i<base.length; ++i){
			let part = value % base[i];
			if(pad[i]){
				part = part.toString(10).padStart(pad[i],'0');
			}
			res = '' + part + sep[i-1] + res;
			value = (value - part) / base[i];
		}
		
		res = '' + value + sep[base.length-1] + res;
		
		return res + post;
	}
	
	return {
		is,
		parse,
		stringify
	}
}

function decoding(code){
	let parts = code.split(/(\d+)/g);
	while(parts[0] === ''){
		if(parts[1] === '1'){
			parts.shift();//Удаляем пустой префикс
			parts.shift();//Удаляем старшую единицу
		}
		else{
			parts[0] = ' ';
		}
	}

	//Теперь в чётных значениях - разделители, в нечётных - базы, причём в обратном порядке
	let base = [], sep = [], post = '';
	for(let i=0; i<parts.length; ++i){
		if(i & 1){
			base.unshift(+parts[i]);
		}
		else{
			sep.unshift(parts[i]);
		}
	}

	if(base.length<sep.length){
		post = sep.shift();
	}
	let pad = base.map((val)=>((val-1).toString(10).length));
	return {base, sep, pad, post};
}

module.exports = sps;