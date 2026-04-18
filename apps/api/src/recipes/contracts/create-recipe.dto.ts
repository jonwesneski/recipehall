import { ApiProperty } from '@nestjs/swagger';
import {
  CuisineType,
  DietaryType,
  DifficultyLevelType,
  DishType,
  MealType,
  MeasurementUnit,
  Prisma,
  ProteinType,
} from '@repo/database';
import { IsNullable } from '@src/common/custom.class-validators';
import { OmitPrismaFieldsDto } from '@src/common/utilityTypes';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class EquipmentDto
  implements OmitPrismaFieldsDto<Prisma.EquipmentCreateInput, 'recipe'>
{
  @ApiProperty({ type: String })
  name: string;
}

export class NutritionalFactsDto
  implements OmitPrismaFieldsDto<Prisma.NutritionalFactsCreateInput, 'recipe'>
{
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  proteinInG: number | null;
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  carbohydratesInG: number | null;
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  fiberInG: number | null;
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  sugarInG: number | null;
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  sodiumInMg: number | null;
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  cholesterolInMg: number | null;
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  saturatedFatInG: number | null;
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  transFatInG: number | null;
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  polyunsaturatedFatInG: number | null;
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  monounsaturatedFatInG: number | null;
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  potassiumInMg: number | null;
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  vitaminAInIU: number | null;
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  vitaminCInMg: number | null;
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  calciumInMg: number | null;
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  ironInMg: number | null;
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  vitaminDInIU: number | null;
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  vitaminB6InMg: number | null;
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  vitaminB12InMg: number | null;
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  magnesiumInMg: number | null;
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  folateInMcg: number | null;
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  thiaminInMg: number | null;
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  riboflavinInMg: number | null;
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  niacinInMg: number | null;
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  caloriesInKcal: number | null;
}

export class CreateIngredientDto
  implements
    OmitPrismaFieldsDto<Prisma.IngredientCreateInput, 'step' | 'displayOrder'>
{
  @IsNumber()
  @Min(0)
  @ApiProperty({ type: Number })
  amount: number;
  @IsBoolean()
  @ApiProperty()
  isFraction: boolean;
  @IsEnum(MeasurementUnit)
  @IsNullable()
  @ApiProperty({ enum: MeasurementUnit, nullable: true })
  unit: MeasurementUnit | null;
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  name: string;
}

export class CreateStepDto
  implements
    OmitPrismaFieldsDto<
      Prisma.StepUncheckedCreateWithoutRecipeInput,
      'displayOrder' | 'recipeId' | 'ingredients' | 'instructions'
    >
{
  @IsString()
  @IsNullable()
  @ApiProperty({ type: String, nullable: true })
  instruction: string | null;
  @IsArray()
  @ApiProperty({ type: [CreateIngredientDto] })
  @ValidateNested({ each: true })
  @Type(() => CreateIngredientDto)
  ingredients: CreateIngredientDto[];
  @IsNullable()
  @IsString()
  @ApiProperty({ type: String, nullable: true })
  base64Image: string | null;
}

export class CreateRecipeDto
  implements
    OmitPrismaFieldsDto<
      Prisma.RecipeUncheckedCreateInput,
      | 'equipments'
      | 'nutritionalFacts'
      | 'userId'
      | 'steps'
      | 'tags'
      | 'imageUrl'
    >
{
  @IsString()
  @IsNotEmpty({ message: 'should not be empty' })
  @ApiProperty({ type: String })
  name: string;
  @IsNotEmpty()
  @IsString()
  @IsNullable()
  @ApiProperty({ type: String, nullable: true })
  description: string | null;
  @IsString()
  @IsNotEmpty()
  @IsNullable()
  @ApiProperty({ type: String, nullable: true })
  base64Image: string | null;
  @IsInt()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  preparationTimeInMinutes: number | null;
  @IsInt()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  cookingTimeInMinutes: number | null;
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateStepDto)
  @ApiProperty({ type: [CreateStepDto] })
  steps: CreateStepDto[];
  @IsNullable()
  @ValidateNested()
  @Type(() => NutritionalFactsDto)
  @ApiProperty({ type: NutritionalFactsDto, nullable: true })
  nutritionalFacts: NutritionalFactsDto | null;
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  servings: number | null;
  @IsNumber()
  @Min(0)
  @IsNullable()
  @ApiProperty({ type: Number, nullable: true })
  servingAmount: number | null;
  @IsEnum(MeasurementUnit)
  @IsNullable()
  @ApiProperty({ enum: MeasurementUnit, nullable: true })
  servingUnit: MeasurementUnit | null;
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ type: [String] })
  tags: string[];
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ type: [String] })
  equipments: string[];
  @IsNullable()
  @IsEnum(CuisineType)
  @ApiProperty({ enum: CuisineType, nullable: true })
  cuisine: CuisineType | null;
  @IsNullable()
  @IsEnum(MealType)
  @ApiProperty({ enum: MealType, nullable: true })
  meal: MealType | null;
  @IsNullable()
  @IsEnum(DishType)
  @ApiProperty({ enum: DishType, nullable: true })
  dish: DishType | null;
  @IsArray()
  @IsEnum(DietaryType, { each: true })
  @ApiProperty({ enum: DietaryType, isArray: true })
  diets: DietaryType[];
  @IsArray()
  @IsEnum(ProteinType, { each: true })
  @ApiProperty({ enum: ProteinType, isArray: true })
  proteins: ProteinType[];
  @IsNullable()
  @IsEnum(DifficultyLevelType)
  @ApiProperty({ enum: DifficultyLevelType, nullable: true })
  difficultyLevel: DifficultyLevelType | null;
  @IsBoolean()
  @ApiProperty({ type: Boolean })
  isPublic: boolean;
}
