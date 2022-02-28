const {MapOfSet} = require('@grunmouse/special-map');
const escaper = require('./escape.js')([',']);

/**
 * Разделяет строку на значения
 * @param code : String
 * @return Array
 */
function parseRow(code){
	code = escaper.escape(code);
	let values = code.split(',')
		.map(escaper.toText)
		.map((s)=>(s.trim()));
	return values;
}

function stringifyRow(row, size){
	let values = row.map(a=>(a== null ? '' : a.toString())).map(escaper.fromText).map(escaper.getRaw);
	
	for(let i = 0; i<values.length-1; ++i){
		values[i] = (values[i]+',').padEnd(size[i]+2);
	}
	
	let code = values.join('');
	
	return code;
}

const REP = '-//-'; //
const HREP = '-/-';
const REPLINE = '--//--';
const HEADLINE = '==';

/**
 * Парсит таблицу значений
 * @param code : String - текст таблицы (из файла)
 */
function parseTable(code){
	let rows = code.trim().split(/[\r\n]+/g);
	let title;
	if(rows[0][0] === '#'){
		title = parseRow(rows.shift().slice(1));
	}
	
	let data = [], comment;
	for(let row of rows){
		if(row[0] === '/'){
			continue;
		}

		data.push(parseRow(row));
	}

	for(let r=0; r<data.length; ++r){
		let row = data[r];
		for(let c = 0; c<row.length; ++c){
			if(row[c] === REP){
				row[c] = data[r-1][c];
			}
			else if(data[r][c] === HREP){
				row[c] = row[c-1];
			}
			else if(row[c] === REPLINE){
				for(let i=c; i<data[r-1].length; ++i){
					row[i] = data[r-1][i];
				}
			}
		}
	}

	for(let r=data.length; r--;){
		if(data[r].some((val)=>(val === HEADLINE))){
			data.splice(r,1);
		}
	}


	if(title){
		data = data.map((values)=>{
			let obj = {};
			values.forEach((val, i, arr)=>{
				let key = title[i] || ''+i;
				obj[key] = val;
			});
			return obj;
		});
	}
	
	return data;
}

function stringifyTable(data, columns){
	if(!Array.isArray(columns)){
		columns = undefined;
	}
	
	if(columns){
		data = data.map((row)=>(
			columns.map((key)=>(row[key]))
		));
	}
	
	/* if(typeof REP !== 'undefined'){
		let last = data[0].slice(0);
		for(let i=1; i<data.length; ++i){
			for(let j=0; j<=data[i].length; ++j){
				if(data[i][j] === last[j]){
					data[i][j] = REP;
				}
				else{
					last[j] = data[i][j];
				}
			}
		}
	} */
	
	let rows = data.slice(0);
	if(columns){
		columns[0] = '#' + columns[0];
		rows.unshift(columns);
	}

	const maxSize = (a, i)=>(Math.max(size[i], a ? a.toString().length : 9));
	let size = rows[0].map((a)=>(a.length));
	rows.slice(1).forEach(row=>{
		size = row.map(maxSize);
	});

	rows = rows.map(a=>stringifyRow(a, size));
	let code = rows.join('\r\n');
	
	return code;
}

function columnIndex(key){
	return (values)=>(values[key]);
}

class Index extends MapOfSet{
	constructor(indexer, table, gen){
		if(typeof indexer === 'string'){
			indexer = columnIndex(indexer);
		}
		if(typeof table === 'function'){
			gen = table;
			table = undefined;
		}
		super();
		this.indexer = indexer;
		if(table){
			this.doIndex(table);
		}
		this.generate = gen;
	}
	
	doIndex(table){
		for(let row of table){
			this.add(row);
		}
	}
	
	get(index){
		if(index === undefined){
			throw new Error('heresy');
		}
		return super.get(index);
	}
	
	add(row){
		let key = this.indexer(row);
		if(typeof key === 'undefined'){
			console.log(row);
			throw new Error('heresy');
		}
		super.add(key, row);
	}
	
	getFirst(index, gen){
		let item;
		if(this.has(index)){
			let s = this.get(index);
			item = [...s][0];
		}
		else if(gen!==false && typeof item === 'undefined' && this.generate){
			item = this.generate(index);
		}
		return item;
	}
}

/**
 * Возвращает класс, который расширяет объект ленивыми свойствами
 */
function Row(lazy){
	let Ctor = function(attributes){
		for(let key in attributes){
			this[key] = attributes[key];
		}
	}
	
	let proto = Ctor.prototype = {constructor:Ctor};
	if(lazy){
		for(let key in lazy){
			const prop = '_' + key;
			const calc = lazy[key];
			Object.defineProperty(proto, key, {
				enumerable:true,
				get:function(){
					if(prop in this){
						return this[prop];
					}
					else{
						this[prop] = calc(this);
						return this[prop]
					}
				},
				set:function(value){
					this[prop] = value;
				}
			});
		}
	}
	return Ctor;
}

class Table extends Array{
	constructor(Row, data){
		data = data ? data.map((x)=>(new Row(x))) : [];
		super(...data);
		Object.defineProperty(this, 'Row', {value:Row});
		Object.defineProperty(this, '_indexes', {value:new Map()});
	}
	
	addIndex(name, index){
		if(!index){
			index = name;
		}
		if(index instanceof Index){
			index.doIndex(this);
		}
		else{
			index = new Index(index, this);
		}
		
		this._indexes.set(name, index);
		
		return index;
	}
	
	addPrimary(name, index){
		if(this._primary){
			throw new Error('primary is exist!');
		}
		let primary = this.addIndex(name, index);
		
		Object.defineProperty(this, '_primary', {value:primary});
		
		return primary;
	}
	
	getFirst(key, gen){
		return this._primary.getFirst(key, gen);
	}
	
	has(key){
		return this._primary.has(key);
	}
	
	keys(){
		if(!this._primary){
			throw new Error('primary is not exist!');
		}
		return this._primary.keys();
	}
	
	push(row){
		if(!(row instanceof this.Row)){
			row = new this.Row(row);
		}
		//console.log(row);
		const len = super.push(row);
		for(let index of this._indexes.values()){
			index.add(row);
		}
		return len;
	}
	
	sort(prop){
		let fun;
		if(typeof prop === 'string'){
			fun = (a,b)=>(+(a[prop]>b[prop])-(a[prop]<b[prop]));
		}
		else if(prop && prop.call){
			fun = prop
		}
		
		return super.sort(fun);
	}
	
	proj(...columns){
		return this.map((row)=>{
			let obj = {};
			for(let key of columns){
				obj[key] = row[key];
			}
			return obj;
		});
	}
}

/**
 * @param T1 - левая таблица
 * @param T2 - правая таблица
 * @param k1 - левый ключ
 * @param k2 - правый ключ
 * @param left : Boolean - LEFT JOIN, иначе INNER JOIN
 */
function join(T1, T2, k1, k2, left){
	let I2 = index(T2, k2);
	let result = [];
	
	T1.forEach((values)=>{
		let r2 = I2.get(values[k1]);
		if(r2){
			result.push({...values, ...r2});
		}
		else if(left){
			result.push({...values});
		}
	});
	
	return result;
}

module.exports = {
	parseTable,
	stringifyTable,
	Row,
	Table,
	Index,
	join
};