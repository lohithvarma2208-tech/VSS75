module alu_4bit (
    input [3:0] A,
    input [3:0] B,
    input [2:0] Opcode,
    output reg [3:0] Result,
    output reg CarryOut,
    output ZeroFlag
);
    assign ZeroFlag = (Result == 4'b0000);

    always @(*) begin
        CarryOut = 1'b0;
        case (Opcode)
            3'b000: {CarryOut, Result} = A + B;       // Addition
            3'b001: {CarryOut, Result} = A - B;       // Subtraction
            3'b010: Result = A & B;                   // Bitwise AND
            3'b011: Result = A | B;                   // Bitwise OR
            3'b100: Result = A ^ B;                   // Bitwise XOR
            3'b101: Result = ~A;                      // Bitwise NOT A
            3'b110: Result = A << 1;                  // Shift Left
            3'b111: Result = A >> 1;                  // Shift Right
            default: Result = 4'b0000;
        endcase
    end
endmodule
