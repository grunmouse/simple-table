class List{
	constructor(itr){
		//super();
		this._list = itr ? [...itr] : [];
		this._hidden = new Set();
	}
	
	hide(value){
		this._hidden.add(value);
	}

	replace(value, ...list){
		let i = this._list.indexOf(value);
		return this._list.splice(i, 1, ...list);
	}
	
	delete(value){
		let i = this._list.indexOf(value);
		return this._list.splice(i, 1);
	}
	
	append(value){
		this._list.push(value);
	}
	
	list(){
		let hidden = this._hidden;
		return this._list.filter((v)=>(!hidden.has(v)))
	}
	
	proceed(){
		//Это те, которые помечены скрытыми, но ещё не удалены
		let hidden = this._hidden;
		return this._list.filter((v)=>(hidden.has(v)))
	}
	
	output(sep, fin){
		let arr = this.list();
		console.log();
		console.log('<b>' + arr.join(sep + '\n') + fin + '</b>');
	}
	
}

module.exports = List;