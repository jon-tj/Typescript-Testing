
// Creates the best fit line using simple arithmetic
function linreg(...args: Renderable[]) {
    if (args.length == 0) throw "breh";

    if (args.length === 1) {
        const b = args[0].y;
        return (x: number) => b;
    } else {
        const n = args.length;
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumXX = 0;

        for (const point of args) {
        sumX += point.x;
        sumY += point.y;
        sumXY += point.x * point.y;
        sumXX += point.x * point.x;
        }

        const a =
        (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const b = (sumY - a * sumX) / n;
        //appendLog("linreg >> "+a+"*x"+" + b")
        return (x: number) => a * x + b;
    }
}

// Uses genetic algorithm to fit a model with (few) parameters to a data set of shape ...(x,y)
function fit(f:Function, ...data:Renderable[]){
    var model:Graph|null=null
    for(const r of renderables)
        if(r instanceof(Graph) && r.func==f){
            model=r
            break
        }
    if(!model) return // no model was found
    if(data.length<1) return // no data to train on so why bother

    // check which parameters affect the model:
    // I'm sure theres a better way of doing this, like having a dependency tree structure,
    //  but it works for small applications, which is exactly what I'm intending to use it for.
    // (Besides, compared to the genetic algorithm, this uses negligible computations)
    const parameters:string[]=[]
    const initial:number[]=[]
    for(const a of freeVariables){
        var a0=(window as any)[a]
        if(!a0) continue
        (window as any)[a]=Infinity
        model=model as Graph
        if(!isFinite(model.func(0))){
            parameters.push(a)
            initial.push(a0)
        }
        (window as any)[a]=a0
    }
    if(parameters.length==0) return // static/hard-coded model :(
    
    var optimized:number[]=
        geneticAlgorithm((v:number[])=>{
            for(var i=0; i<v.length; i++)
                (window as any)[parameters[i]]=v[i]
            
            var mse=0
            for(var i=0; i<data.length; i++)
                mse+=(model!.func(data[i].x)-data[i].y)**2
            return mse
        },initial)
    for(var i=0; i<parameters.length; i++)
        (window as any)[parameters[i]]=optimized[i]
    Render()
    var outMsg="{"+parameters[0]+":"+optimized[0].toFixed(3)
    for(var i=1; i<parameters.length; i++) outMsg+=", "+parameters[i]+":"+optimized[i].toFixed(3)
    return outMsg+"}"

}

// Genetic algorithm optimizer for parameter optimization
// NOTE: gen-algs generally do poorly with higher-dimensional search spaces.
// As a rule of thumb, try to keep the dimensionality <= 3.
function geneticAlgorithm(cost:Function,initial:number[]=[],n=100):number[]{
    // Simulation properties:
    const pMutate=0.2
    const mutateRadiusMax=10 // unfortunately no one-size-fits-all answer, but ~10 seems appropriate for most applications
    const mutateDecayFactor=0.9 // how rapidly mutation radius converges to 0
    const populationSize=300

    // Algo consists of two parts:
    //(re)population and mutation:
    function populate(){
        var remainingPop=population.length
        const mutateFirstIter=remainingPop == 1 ? 1 : 0
        for(var i=population.length; i<populationSize; i++){
            var baby=[]
            for(var j=0; j<initial.length; j++){
                var parent=Math.floor(Math.random()*remainingPop)
                baby.push(population[parent][j])
            }
            for(var j=0; j<initial.length; j++)
                if(Math.random()<pMutate+mutateFirstIter)
                    baby[j]+=(Math.random()-0.5)*mutateRadius
            population.push(baby)
        }
    }
    // ... and termination of the most costy percentile:
    function terminate(){
        var c:number[]=population.map((individual) => cost(individual))
        var minc=Math.min(...c)
        var maxc=Math.max(...c)
        var threshold=minc+(maxc-minc)*0.8 // terminates 80% of the pop
        for(var i=population.length-1; i>=0; --i){
            if(c[i]>threshold) population.splice(i,1)
        }
    }
    // Run the algorithm
    var mutateRadius=mutateRadiusMax
    var population:number[][]=[initial]
    for(;n>0; n--){
        populate()
        terminate()
        mutateRadius*=mutateDecayFactor
    }
    // Return the best individual
    var c:number[]=population.map((individual) => cost(individual))
    var minc=Math.min(...c)
    for(var i=0; i<population.length; i++)
        if(c[i]==minc) return population[i]
    
    return initial // ...fallback
}