using Microsoft.EntityFrameworkCore.Migrations;
using System;

namespace FinanceSimplified.Data.Migrations
{
    public partial class InitialMigration : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Alter the id column in users table to be varchar(20)
            migrationBuilder.AlterColumn<string>(
                name: "id",
                table: "users",
                type: "varchar(20)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");
                
            // Do the same for other tables
            migrationBuilder.AlterColumn<string>(
                name: "id",
                table: "wallets",
                type: "varchar(20)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");
                
            migrationBuilder.AlterColumn<string>(
                name: "id",
                table: "transactions",
                type: "varchar(20)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");
                
            migrationBuilder.AlterColumn<string>(
                name: "id",
                table: "tokens",
                type: "varchar(20)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");
                
            migrationBuilder.AlterColumn<string>(
                name: "id",
                table: "stakingpositions",
                type: "varchar(20)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");
                
            migrationBuilder.AlterColumn<string>(
                name: "id",
                table: "notifications",
                type: "varchar(20)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revert changes if needed
            migrationBuilder.AlterColumn<int>(
                name: "id",
                table: "users",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(20)");
                
            // Revert other tables as well
            migrationBuilder.AlterColumn<int>(
                name: "id",
                table: "wallets",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(20)");
                
            migrationBuilder.AlterColumn<int>(
                name: "id",
                table: "transactions",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(20)");
                
            migrationBuilder.AlterColumn<int>(
                name: "id",
                table: "tokens",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(20)");
                
            migrationBuilder.AlterColumn<int>(
                name: "id",
                table: "stakingpositions",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(20)");
                
            migrationBuilder.AlterColumn<int>(
                name: "id",
                table: "notifications",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(20)");
        }
    }
}
