import DbManager from "../src/DbManager.mts";

describe("DbManager tests", ()=>{

    afterEach( async ()=>{
        await DbManager.getInstance({uri: "sqlite::memory"}).close()
    });

    it("should throw error when using constructor", ()=>{
        expect(()=>{new DbManager({uri: "sqlite::memory"})}).toThrow("Cannot use DBManager's constructor, should use GetInstance() instead");
    });

    it("should return an instance of DbManager when using getInstance()", ()=>{
        expect(DbManager.getInstance({uri: "sqlite::memory"})).toBeInstanceOf(DbManager);
    });

    it("should return true when testing connection in memory", async()=>{
        var dbMan: DbManager = await DbManager.getInstance({uri: "sqlite::memory"});
        expect(await dbMan.connect()).toBe(true);
    });




    
});