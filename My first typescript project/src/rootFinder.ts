function NewtonsMethod(f:Function,x:number=NaN){
    if(isNaN(x)) x = (Math.random()-0.5)*10;
    let iteration = 0;

    while (Math.abs(f(x)) > 0.000001 && iteration < 30) {
        x = x - f(x) / der(f)(x);
        iteration++;
    }
    if(iteration==30) return NaN
    return x;
}
function extremums(f:Function){
    return roots(der(f))
}
function roots(f:Function){
    var roots:number[]=[]
    Array.from({ length: 21 }, (_, index) => index - 10).forEach((x)=>{
        var root=NewtonsMethod(f,x)
        if(!isNaN(root)) roots.push(root)
    })
    const roundedNumbers = mergeDuplicates(roots).map(root => Math.round(1000*root)*0.001);
    return roundedNumbers.join(',');
}
function mergeDuplicates(arr:number[], threshold:number=0.01):number[] {
    const sum = [arr[0]]
    const count = [1]
    for (let i = 0; i < arr.length; i++) {
        if(isNaN(arr[i])) continue
        var groupWasFound=false
        for (let j = 0; j < sum.length; j++) {
            var mean=sum[j]/count[j]
            if (Math.abs(arr[i] -mean) < threshold) {
                sum[j]+=arr[i]
                count[j]++
                groupWasFound=true
                break
            }
        }
        if(!groupWasFound){
            sum.push(arr[i])
            count.push(1)
        }
    }
  
    for (let i = 0; i < sum.length; i++)
        sum[i]/=count[i] // find mean
    return sum
  }

function der(f:Function):Function{
    return (x:number)=>(f(x+0.000001)-f(x))/0.000001
}
