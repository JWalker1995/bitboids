class Context {
  private objs = new Map();

  get<T>(Type: { new (context: Context): T }): T {
    if (!this.objs.has(Type)) {
      this.objs.set(Type, new Type(this));
    }
    return this.objs.get(Type);
  }
}

export default Context;
